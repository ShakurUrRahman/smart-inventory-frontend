"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import {
	Search,
	Plus,
	Pencil,
	Trash2,
	ArrowUp,
	AlertTriangle,
	ChevronLeft,
	ChevronRight,
	X,
	XCircle,
	CheckCircle,
	Clock,
	AlertCircle,
	Loader2,
	Eye,
	PencilRuler,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkeletonGrid } from "@/components/shared/Skeleton";
import { categoriesApi } from "@/lib/categoriesApi";
import { productsApi, Product } from "@/lib/productsApi";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {
	AddEditProductDialog,
	DeleteProductDialog,
	RestockProductDialog,
} from "@/components/products/ProductModals";
import { useDebounce } from "@/hooks/useSearch";
import { useAuthStore } from "@/store/authStore";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Modal,
	ModalBody,
	ModalFooter,
	ModalHeader,
} from "@/components/shared/DialogModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import usePermissions from "@/hooks/usePermissions";

function UserProductCard({
	product,
	onEdit,
	onDelete,
	isEditLoading,
	isDeleteLoading,
}: any) {
	const approvalStatus = product.approvalStatus;

	const borderClass =
		approvalStatus === "pending"
			? "border-amber-500/40 border-dashed"
			: approvalStatus === "rejected"
				? "border-red-500/40 border-dashed"
				: "border-white/10";

	const badge =
		approvalStatus === "pending" ? (
			<span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
				<Clock className="w-3 h-3" /> Pending Approval
			</span>
		) : approvalStatus === "rejected" ? (
			<span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
				<XCircle className="w-3 h-3" /> Rejected
			</span>
		) : (
			<span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
				<CheckCircle className="w-3 h-3" /> Approved
			</span>
		);

	return (
		<div
			className={`bg-[#13161F] border ${borderClass} rounded-xl p-4 space-y-3`}
		>
			<div className="flex justify-between items-start gap-2">
				<p className="text-white font-semibold truncate">
					{product.name}
				</p>
				{badge}
			</div>

			<div className="text-xs text-zinc-400 space-y-1">
				<p>
					Category:{" "}
					{typeof product.category === "object"
						? product.category?.name
						: product.category}
				</p>
				<p>
					Price: ${product.price.toFixed(2)} · Stock: {product.stock}
				</p>
			</div>

			{/* Rejection reason */}
			{approvalStatus === "rejected" && product.rejectionReason && (
				<div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-400">
					<p className="font-medium mb-0.5">❌ Rejection Reason:</p>
					<p className="text-red-300">{product.rejectionReason}</p>
				</div>
			)}

			{/* Pending note */}
			{approvalStatus === "pending" && (
				<p className="text-xs text-zinc-500 italic">
					Awaiting review by admin or manager
				</p>
			)}

			<div className="flex items-center gap-2">
				<button
					onClick={() => onEdit(product)}
					className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs transition"
				>
					<Pencil className="w-3.5 h-3.5" />
					{approvalStatus === "rejected" ? "Edit & Resubmit" : "Edit"}
				</button>
				<button
					onClick={() => onDelete(product)}
					className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs transition"
				>
					<Trash2 className="w-3.5 h-3.5" />
					Delete
				</button>
			</div>
		</div>
	);
}

export default function ProductsPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const queryClient = useQueryClient();
	const { user } = useAuthStore();
	const { isUser, isManager, isAdmin, isSuperAdmin } = usePermissions();
	const [userTab, setUserTab] = useState("all");

	// URL-synced filters
	const [search, setSearch] = useState(searchParams.get("search") || "");
	const [categoryFilter, setCategoryFilter] = useState(
		searchParams.get("category") || "",
	);
	const [statusFilter, setStatusFilter] = useState(
		searchParams.get("status") || "",
	);
	const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
	const debouncedSearch = useDebounce(search, 300);

	// Dialog states
	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [restockDialogOpen, setRestockDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(
		null,
	);
	const [submittedProduct, setSubmittedProduct] = useState<Product | null>(
		null,
	);
	const [rejectDialogProduct, setRejectDialogProduct] = useState<any>(null);
	const [rejectReason, setRejectReason] = useState("");

	const LIMIT = 10;

	// Update URL when filters change
	const updateUrl = (
		newSearch: string,
		newCategory: string,
		newStatus: string,
		newPage: number,
	) => {
		const params = new URLSearchParams();
		if (newSearch) params.set("search", newSearch);
		if (newCategory) params.set("category", newCategory);
		if (newStatus) params.set("status", newStatus);
		if (newPage > 1) params.set("page", newPage.toString());
		router.push(`/products?${params.toString()}`);
	};

	// Debounced search
	const handleSearchChange = (value: string) => setSearch(value);

	// Fetch categories for dropdown
	const { data: categories = [] } = useQuery({
		queryKey: ["categories"],
		queryFn: categoriesApi.getAllCategories,
	});

	// Fetch products
	const { data: productsData, isLoading } = useQuery({
		queryKey: ["products", { search, categoryFilter, statusFilter, page }],
		queryFn: () =>
			productsApi.getAllProducts({
				search: debouncedSearch || undefined,
				category: categoryFilter || undefined,
				status: statusFilter || undefined,
				page,
				limit: LIMIT,
			}),
	});

	// Mutations
	const createMutation = useMutation({
		mutationFn: (payload: any) => productsApi.createProduct(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["products"] });
			setAddDialogOpen(false);
			toast.success("Product created successfully!");
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, payload }: any) =>
			productsApi.updateProduct(id, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["products"] });
			setEditDialogOpen(false);
			toast.success("Product updated successfully!");
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => productsApi.deleteProduct(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["products"] });
			setDeleteDialogOpen(false);
			toast.success("Product deleted successfully!");
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const restockMutation = useMutation({
		mutationFn: ({ id, quantity }: any) =>
			productsApi.restockProduct(id, { quantity }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["products"] });
			setRestockDialogOpen(false);
			toast.success("Product restocked successfully!");
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const approveMutation = useMutation({
		mutationFn: (id: string) => adminApi.approveProduct(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["products"] });
			toast.success("Product approved!");
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const rejectMutation = useMutation({
		mutationFn: (id: string) =>
			adminApi.rejectProduct(id, { reason: rejectReason }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["products"] });
			setRejectDialogProduct(null);
			setRejectReason("");
			toast.success("Product rejected.");
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const products = productsData?.data || [];
	const total = productsData?.total || 0;
	const totalPages = productsData?.totalPages || 1;
	const isEmpty = products.length === 0 && !isLoading;

	const userProducts = useMemo(
		() => ({
			approved: products.filter(
				(p: any) => p.approvalStatus === "approved",
			),
			pending: products.filter(
				(p: any) => p.approvalStatus === "pending",
			),
			rejected: products.filter(
				(p: any) => p.approvalStatus === "rejected",
			),
		}),
		[products],
	);

	const handleAddProduct = (payload: any) =>
		createMutation.mutateAsync(payload);
	const handleEditProduct = (payload: any) => {
		if (selectedProduct) {
			updateMutation.mutateAsync({ id: selectedProduct._id, payload });
		}
	};
	const handleDeleteProduct = async () => {
		setDeleteDialogOpen(false);
		if (selectedProduct) {
			await deleteMutation.mutateAsync(selectedProduct._id);
			setSelectedProduct(null);
		}
	};
	const handleRestockProduct = (quantity: number) => {
		if (selectedProduct) {
			restockMutation.mutateAsync({ id: selectedProduct._id, quantity });
		}
	};

	const handleEditClick = (product: Product) => {
		setSelectedProduct(product);
		setEditDialogOpen(true);
	};

	const handleRestockClick = (product: Product) => {
		setSelectedProduct(product);
		setRestockDialogOpen(true);
	};

	const handleDeleteClick = (product: Product) => {
		setSelectedProduct(product);
		setDeleteDialogOpen(true);
	};

	console.log(userProducts);

	if (isUser) {
		return (
			<motion.div
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
			>
				<PageHeader
					title="My Products"
					subtitle={`${total} product${total !== 1 ? "s" : ""} submitted`}
					action={
						<Button
							onClick={() => setAddDialogOpen(true)}
							className="bg-indigo-600 hover:bg-indigo-500 gap-2"
						>
							<Plus className="w-4 h-4" />
							<span className="hidden sm:inline">
								Submit Product
							</span>
						</Button>
					}
				/>

				{/* Status Tabs */}
				<div className="relative mb-6">
					<div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 overflow-x-auto hide-scrollbar">
						{[
							{
								value: "all",
								label: "All",
								icon: "📦",
								color: "border-2 border-indigo-600",
								count: total,
							},
							{
								value: "approved",
								label: "Approved",
								icon: "✅",
								color: "border-2 border-emerald-600",
								count: userProducts.approved.length,
							},
							{
								value: "pending",
								label: "Pending",
								icon: "⏳",
								color: "border-2 border-amber-600",
								count: userProducts.pending.length,
							},
							{
								value: "rejected",
								label: "Rejected",
								icon: "❌",
								color: "border-2 border-red-600",
								count: userProducts.rejected.length,
							},
						].map((tab) => (
							<button
								key={tab.value}
								onClick={() => setUserTab(tab.value)}
								className="relative flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
							>
								{userTab === tab.value && (
									<motion.div
										layoutId="userProductTab"
										className={`absolute inset-0 ${tab.color} rounded-lg`}
										transition={{
											type: "spring",
											stiffness: 400,
											damping: 35,
										}}
									/>
								)}
								<span className="relative z-10">
									{tab.icon}
								</span>
								<span
									className={`relative z-10 transition-colors ${userTab === tab.value ? "text-white" : "text-zinc-400 hover:text-zinc-300"}`}
								>
									{tab.label}
								</span>
								<span
									className={`relative z-10 text-xs px-1.5 py-0.5 rounded-full transition-colors ${
										userTab === tab.value
											? "bg-white/20 text-white"
											: "bg-white/10 text-zinc-500"
									}`}
								>
									{tab.count}
								</span>
							</button>
						))}
					</div>
				</div>

				<div className="bg-[#13161F] border border-white/10 rounded-xl p-4 mb-6 space-y-3">
					{/* Search */}
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
						<Input
							placeholder="Search products..."
							value={search}
							onChange={(e) => handleSearchChange(e.target.value)}
							className="pl-10 pr-9 bg-[#1C1F2A] border-zinc-700/60 focus:outline-none focus:ring-0
  data-[highlighted]:bg-white/10 placeholder:text-white/50
  data-[highlighted]:text-white
  data-[highlighted]:outline-none
  data-[highlighted]:ring-0"
						/>
						{search && (
							<button
								onClick={() => handleSearchChange("")}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
							>
								<X className="w-4 h-4" />
							</button>
						)}
					</div>

					{/* Category & Status Filters */}
					<div className="flex flex-wrap gap-2">
						<Select
							value={categoryFilter}
							onValueChange={(value) => {
								setCategoryFilter(value);
								setPage(1);
								updateUrl(search, value, statusFilter, 1);
							}}
						>
							<SelectTrigger className="flex-1 border min-w-[130px] bg-[#1C1F2A] border-zinc-700/60 text-white text-sm">
								<SelectValue placeholder="All Categories" />
							</SelectTrigger>
							<SelectContent
								side="bottom"
								sideOffset={4}
								position="popper"
								avoidCollisions={false}
								className="bg-[#1C1F2A] border border-zinc-700/60 text-white
             w-[--radix-select-trigger-width] p-1 ring-0"
							>
								<SelectItem
									className=" focus:outline-none focus:ring-0
  data-[highlighted]:bg-white/10
  data-[highlighted]:text-white
  data-[highlighted]:outline-none
  data-[highlighted]:ring-0"
									value="all"
								>
									All Categories
								</SelectItem>
								{categories.map((cat) => (
									<SelectItem
										className=" focus:outline-none focus:ring-0
  data-[highlighted]:bg-white/10
  data-[highlighted]:text-white
  data-[highlighted]:outline-none
  data-[highlighted]:ring-0"
										key={cat._id}
										value={cat._id}
									>
										{cat.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<div className="flex gap-2 flex-wrap">
							{["", "Active", "Out of Stock"].map((status) => (
								<button
									key={status}
									onClick={() => {
										setStatusFilter(status);
										setPage(1);
										updateUrl(
											search,
											categoryFilter,
											status,
											1,
										);
									}}
									className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
										statusFilter === status
											? "bg-indigo-600 text-white"
											: "bg-[#1C1F2A] border border-zinc-700/60 text-zinc-300 hover:bg-white/10"
									}`}
								>
									{status || "All"}
								</button>
							))}
						</div>
					</div>
				</div>

				{/* Tab Content */}
				<AnimatePresence mode="wait">
					{(["all", "approved", "pending", "rejected"] as const).map(
						(tab) => {
							if (userTab !== tab) return null;

							const tabProducts =
								tab === "all"
									? [
											...userProducts.approved,
											...userProducts.pending,
											...userProducts.rejected,
										]
									: userProducts[tab];
							const PRODUCT_BADGE: Record<
								string,
								{ label: string; className: string }
							> = {
								Active: {
									label: "Active",
									className:
										"bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
								},
								Out_of_stock: {
									label: "Out of stock",
									className:
										"bg-red-500/20 text-red-400 border-red-500/30",
								},
							};
							const APPROVAL_BADGE: Record<
								string,
								{ label: string; className: string }
							> = {
								approved: {
									label: "Approved",
									className:
										"bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
								},
								pending: {
									label: "Pending",
									className:
										"bg-amber-500/20 text-amber-400 border-amber-500/30",
								},
								rejected: {
									label: "Rejected",
									className:
										"bg-red-500/20 text-red-400 border-red-500/30",
								},
							};

							return (
								<motion.div
									key={tab}
									initial={{ opacity: 0, y: 8 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -8 }}
									transition={{ duration: 0.2 }}
								>
									{isLoading ? (
										Array.from({ length: 8 }).map(
											(_, i) => (
												<tr
													key={i}
													className="border-b border-white/5"
												>
													{Array.from({
														length: 17,
													}).map((_, j) => (
														<td
															key={j}
															className="px-3 py-3"
														>
															<div className="h-4 w-12 bg-white/10 rounded animate-pulse" />
														</td>
													))}
												</tr>
											),
										)
									) : tabProducts.length === 0 ? (
										<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
											<div className="text-5xl mb-4">
												📦
											</div>
											<h3 className="text-lg font-semibold text-white mb-2">
												No {tab} products yet
											</h3>
											<p className="text-zinc-400 mb-6 text-sm">
												{tab === "approved"
													? "Your approved products will appear here."
													: tab === "pending"
														? "Products awaiting review will appear here."
														: "Rejected products will appear here."}
											</p>

											<Button
												onClick={() => {
													setSearch("");
													setCategoryFilter("");
													setStatusFilter("");
													setPage(1);
													updateUrl("", "", "", 1);
												}}
												className="bg-indigo-600 hover:bg-indigo-500"
											>
												Clear Filters
											</Button>
										</div>
									) : (
										<div className="lg:bg-[#13161F] lg:border lg:border-white/10 rounded-xl overflow-hidden">
											{/* Desktop Table */}
											<div className="hidden lg:block overflow-x-auto">
												<table className="w-full text-sm min-w-[640px]">
													<thead>
														<tr className="border-b border-white/10 bg-black/20">
															<th className="px-3 py-3 text-left font-semibold text-zinc-300 w-10">
																#
															</th>
															<th className="px-3 py-3 text-left font-semibold text-zinc-300">
																Product Name
															</th>
															<th className="px-3 py-3 text-left font-semibold text-zinc-300 hidden sm:table-cell">
																Category
															</th>
															<th className="px-3 py-3 text-left font-semibold text-zinc-300">
																Price
															</th>
															<th className="px-3 py-3 text-left font-semibold text-zinc-300">
																Stock
															</th>
															<th className="px-3 py-3 text-left font-semibold text-zinc-300 hidden md:table-cell">
																Threshold
															</th>
															<th className="px-3 py-3 text-left font-semibold text-zinc-300">
																Approval
															</th>
															<th className="px-3 py-3 text-left font-semibold text-zinc-300">
																Status
															</th>
															<th className="px-3 py-3 text-left font-semibold text-zinc-300">
																Actions
															</th>
														</tr>
													</thead>
													<tbody>
														{tabProducts.map(
															(
																product: any,
																idx: number,
															) => {
																const isLowStock =
																	product.stock >
																		0 &&
																	product.stock <=
																		product.minStockThreshold;
																const isOutOfStock =
																	product.stock ===
																	0;
																const badge =
																	APPROVAL_BADGE[
																		product
																			.approvalStatus
																	] ?? {
																		label: product.approvalStatus,
																		className:
																			"bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
																	};
																const status =
																	PRODUCT_BADGE[
																		product
																			.status
																	] ?? {
																		label: product.status,
																		className:
																			"bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
																	};
																return (
																	<React.Fragment
																		key={
																			product._id
																		}
																	>
																		<tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
																			<td className="px-3 py-3 text-zinc-400 text-xs">
																				{idx +
																					1}
																			</td>
																			<td className="px-3 py-3 text-white font-medium">
																				<p className="truncate max-w-[180px]">
																					{
																						product.name
																					}
																				</p>
																				{/* Category inline on small */}
																				<p className="text-xs text-zinc-500 sm:hidden mt-0.5">
																					{typeof product.category ===
																					"string"
																						? product.category
																						: product
																								.category
																								?.name}
																				</p>
																			</td>
																			<td className="px-3 py-3 text-zinc-400 hidden sm:table-cell">
																				{typeof product.category ===
																				"string"
																					? product.category
																					: product
																							.category
																							?.name}
																			</td>
																			<td className="px-3 py-3 text-white">
																				$
																				{product.price.toFixed(
																					2,
																				)}
																			</td>
																			<td
																				className={`px-3 py-3 font-medium ${isOutOfStock ? "text-red-400" : isLowStock ? "text-amber-400" : "text-green-400"}`}
																			>
																				<div className="flex items-center gap-1.5">
																					{isLowStock &&
																						!isOutOfStock && (
																							<AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
																						)}
																					{
																						product.stock
																					}
																					{isOutOfStock && (
																						<span className="px-1.5 py-0.5 rounded text-xs bg-red-500/20 text-red-400 border border-red-500/30">
																							Out
																						</span>
																					)}
																				</div>
																			</td>
																			<td className="px-3 py-3 text-zinc-400 hidden md:table-cell">
																				{
																					product.minStockThreshold
																				}
																			</td>
																			<td className="px-3 py-3">
																				<span
																					className={`px-2 py-1 rounded-full text-xs font-medium border ${badge.className}`}
																				>
																					{
																						badge.label
																					}
																				</span>
																			</td>
																			<td>
																				<span
																					className={`px-2 py-1 rounded-full text-xs font-medium border ${status.className}`}
																				>
																					{
																						status.label
																					}
																				</span>
																			</td>
																			<td className="px-3 py-3">
																				<div className="flex items-center gap-1.5">
																					<button
																						onClick={() =>
																							handleEditClick(
																								product,
																							)
																						}
																						className="p-1.5 rounded hover:bg-blue-500/20 text-blue-400 transition"
																						title={
																							product.approvalStatus ===
																							"rejected"
																								? "Edit & Resubmit"
																								: "Edit"
																						}
																					>
																						{product.approvalStatus ===
																						"rejected" ? (
																							<PencilRuler className="w-4 h-4" />
																						) : (
																							<Pencil className="w-4 h-4" />
																						)}
																					</button>
																					<button
																						onClick={() =>
																							handleDeleteClick(
																								product,
																							)
																						}
																						className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition"
																						title="Delete"
																					>
																						<Trash2 className="w-4 h-4" />
																					</button>
																					{isLowStock && (
																						<button
																							onClick={() =>
																								handleRestockClick(
																									product,
																								)
																							}
																							className="p-1.5 rounded hover:bg-amber-500/20 text-amber-400 transition"
																							title="Restock"
																						>
																							<ArrowUp className="w-4 h-4" />
																						</button>
																					)}
																				</div>
																			</td>
																		</tr>

																		{/* Rejection reason inline row */}
																		{product.approvalStatus ===
																			"rejected" &&
																			product.rejectionReason && (
																				<tr className="border-b border-white/5 bg-red-500/5">
																					<td
																						colSpan={
																							9
																						}
																						className="px-3 py-2"
																					>
																						<div className="flex items-start gap-2 text-xs text-red-400">
																							<AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
																							<span>
																								<strong>
																									Rejection
																									reason:
																								</strong>{" "}
																								{
																									product.rejectionReason
																								}
																							</span>
																						</div>
																					</td>
																				</tr>
																			)}
																	</React.Fragment>
																);
															},
														)}
													</tbody>
												</table>
											</div>

											{/* Mobile Cards */}
											<div className="block lg:hidden space-y-3 p-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
												{tabProducts.map(
													(product: any) => {
														const isLowStock =
															product.stock > 0 &&
															product.stock <=
																product.minStockThreshold;
														const isOutOfStock =
															product.stock === 0;
														const badge =
															APPROVAL_BADGE[
																product
																	.approvalStatus
															] ?? {
																label: product.approvalStatus,
																className:
																	"bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
															};

														const borderClass =
															product.approvalStatus ===
															"pending"
																? "border-amber-500/30 border-dashed"
																: product.approvalStatus ===
																	  "rejected"
																	? "border-red-500/30 border-dashed"
																	: "border-white/10";

														return (
															<div
																key={
																	product._id
																}
																className={`bg-[#1b1e28] border ${borderClass} p-4 rounded-xl space-y-2.5`}
															>
																{/* Header */}
																<div className="flex justify-between items-start gap-2">
																	<p className="text-white font-semibold text-sm truncate">
																		{
																			product.name
																		}
																	</p>
																	<span
																		className={`px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${badge.className}`}
																	>
																		{
																			badge.label
																		}
																	</span>
																</div>

																{/* Details */}
																<p className="text-zinc-400 text-xs">
																	{typeof product.category ===
																	"string"
																		? product.category
																		: product
																				.category
																				?.name}
																</p>
																<div className="flex items-center gap-4">
																	<p className="text-white text-sm">
																		$
																		{product.price.toFixed(
																			2,
																		)}
																	</p>
																	<p
																		className={`text-sm font-medium ${isOutOfStock ? "text-red-400" : isLowStock ? "text-amber-400" : "text-green-400"}`}
																	>
																		Stock:{" "}
																		{
																			product.stock
																		}
																		{isOutOfStock &&
																			" (Out)"}
																		{isLowStock &&
																			!isOutOfStock &&
																			" (Low)"}
																	</p>
																</div>

																{/* Rejection reason */}
																{product.approvalStatus ===
																	"rejected" &&
																	product.rejectionReason && (
																		<div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
																			<AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
																			<p className="text-red-400 text-xs">
																				{
																					product.rejectionReason
																				}
																			</p>
																		</div>
																	)}

																{/* Pending note */}
																{product.approvalStatus ===
																	"pending" && (
																	<p className="text-zinc-500 text-xs italic">
																		Awaiting
																		review
																		by admin
																		or
																		manager
																	</p>
																)}

																{/* Actions */}
																<div className="flex gap-2 pt-1">
																	<button
																		onClick={() =>
																			handleEditClick(
																				product,
																			)
																		}
																		className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 text-xs transition"
																	>
																		<Pencil className="w-3.5 h-3.5" />
																		{product.approvalStatus ===
																		"rejected"
																			? "Resubmit"
																			: "Edit"}
																	</button>

																	<button
																		onClick={() =>
																			handleDeleteClick(
																				product,
																			)
																		}
																		className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-xs transition"
																	>
																		<Trash2 className="w-3.5 h-3.5" />{" "}
																		Delete
																	</button>
																	{/* {isLowStock && (
																		<button
																			onClick={() =>
																				handleRestockClick(
																					product,
																				)
																			}
																			className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-xs transition"
																			title="Restock"
																		>
																			<ArrowUp className="w-4 h-4" />
																			Restock
																		</button>
																	)} */}
																</div>
															</div>
														);
													},
												)}
											</div>
										</div>
									)}
								</motion.div>
							);
						},
					)}
				</AnimatePresence>

				{/* Edit Dialog */}
				<AddEditProductDialog
					open={editDialogOpen}
					onOpenChange={(open) => {
						if (!open) {
							setEditDialogOpen(false);
							setSelectedProduct(null);
						}
					}}
					product={selectedProduct}
					categories={categories}
					onSubmit={(payload: any) => {
						if (selectedProduct)
							updateMutation.mutateAsync({
								id: selectedProduct._id,
								payload,
							});
					}}
					isLoading={updateMutation.isPending}
					warningBanner={
						selectedProduct?.approvalStatus === "approved" ? (
							<div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs mb-4">
								<AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
								Editing an approved product will reset it to
								pending and require re-approval.
							</div>
						) : selectedProduct?.approvalStatus === "rejected" ? (
							<div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs mb-4">
								<AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
								Updating this product will resubmit it for
								approval.
							</div>
						) : null
					}
				/>

				{/* Add Dialog */}
				<AddEditProductDialog
					open={addDialogOpen}
					onOpenChange={(open) => {
						if (!open) setAddDialogOpen(false);
					}}
					product={null}
					categories={categories}
					onSubmit={(payload: any) =>
						createMutation.mutateAsync(payload)
					}
					isLoading={createMutation.isPending}
				/>

				{/* Delete Dialog */}
				{selectedProduct && (
					<DeleteProductDialog
						open={deleteDialogOpen}
						onOpenChange={setDeleteDialogOpen}
						onConfirm={async () => {
							await deleteMutation.mutateAsync(
								selectedProduct._id,
							);
							setSelectedProduct(null);
						}}
						productName={selectedProduct.name}
						isLoading={deleteMutation.isPending}
					/>
				)}
			</motion.div>
		);
	}
	if (isSuperAdmin || isAdmin || isManager)
		return (
			<motion.div
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
			>
				<PageHeader
					title="Products"
					subtitle={`${total} total product${total !== 1 ? "s" : ""}`}
					action={
						<Button
							onClick={() => setAddDialogOpen(true)}
							className="bg-indigo-600 hover:bg-indigo-500 gap-2"
						>
							<Plus className="w-4 h-4" />
							<span className="hidden sm:inline">
								Add Product
							</span>
						</Button>
					}
				/>

				{/* Filter Bar */}
				<div className="bg-[#13161F] border border-white/10 rounded-xl p-4 mb-6 space-y-3">
					{/* Search */}
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
						<Input
							placeholder="Search products..."
							value={search}
							onChange={(e) => handleSearchChange(e.target.value)}
							className="pl-10 pr-9 bg-[#1C1F2A] border-zinc-700/60 focus:outline-none focus:ring-0
  data-[highlighted]:bg-white/10
  data-[highlighted]:text-white
  data-[highlighted]:outline-none
  data-[highlighted]:ring-0"
						/>
						{search && (
							<button
								onClick={() => handleSearchChange("")}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
							>
								<X className="w-4 h-4" />
							</button>
						)}
					</div>

					{/* Category & Status Filters */}
					<div className="flex flex-wrap gap-2">
						<Select
							value={categoryFilter}
							onValueChange={(value) => {
								setCategoryFilter(value);
								setPage(1);
								updateUrl(search, value, statusFilter, 1);
							}}
						>
							<SelectTrigger className="flex-1 border min-w-[130px] bg-[#1C1F2A] border-zinc-700/60 text-white text-sm">
								<SelectValue placeholder="All Categories" />
							</SelectTrigger>
							<SelectContent
								side="bottom"
								sideOffset={4}
								position="popper"
								avoidCollisions={false}
								className="bg-[#1C1F2A] border border-zinc-700/60 text-white
             w-[--radix-select-trigger-width] p-1 ring-0"
							>
								<SelectItem
									className=" focus:outline-none focus:ring-0
  data-[highlighted]:bg-white/10
  data-[highlighted]:text-white
  data-[highlighted]:outline-none
  data-[highlighted]:ring-0"
									value="all"
								>
									All Categories
								</SelectItem>
								{categories.map((cat) => (
									<SelectItem
										className=" focus:outline-none focus:ring-0
  data-[highlighted]:bg-white/10
  data-[highlighted]:text-white
  data-[highlighted]:outline-none
  data-[highlighted]:ring-0"
										key={cat._id}
										value={cat._id}
									>
										{cat.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<div className="flex gap-2 flex-wrap">
							{["", "Active", "Out of Stock"].map((status) => (
								<button
									key={status}
									onClick={() => {
										setStatusFilter(status);
										setPage(1);
										updateUrl(
											search,
											categoryFilter,
											status,
											1,
										);
									}}
									className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
										statusFilter === status
											? "bg-indigo-600 text-white"
											: "bg-[#1C1F2A] border border-zinc-700/60 text-zinc-300 hover:bg-white/10"
									}`}
								>
									{status || "All"}
								</button>
							))}
						</div>
					</div>
				</div>

				{/* Empty State */}
				{isEmpty && (
					<div className="flex flex-col items-center justify-center py-16 px-4">
						<div className="text-center">
							<div className="text-5xl mb-4">📦</div>
							<h3 className="text-lg font-semibold text-white mb-2">
								No products found
							</h3>
							<p className="text-zinc-400 mb-6">
								{search || categoryFilter || statusFilter
									? "Try clearing the filters"
									: "Create your first product to get started"}
							</p>
							{search || categoryFilter || statusFilter ? (
								<Button
									onClick={() => {
										setSearch("");
										setCategoryFilter("");
										setStatusFilter("");
										setPage(1);
										updateUrl("", "", "", 1);
									}}
									className="bg-indigo-600 hover:bg-indigo-500"
								>
									Clear Filters
								</Button>
							) : (
								<Button
									onClick={() => setAddDialogOpen(true)}
									className="bg-indigo-600 hover:bg-indigo-500 gap-2"
								>
									<Plus className="w-4 h-4" />
									Add First Product
								</Button>
							)}
						</div>
					</div>
				)}

				{/* Products Table */}
				{(!isEmpty || isLoading) && (
					<div className="lg:bg-[#13161F] lg:border lg:border-white/10 rounded-xl overflow-hidden ">
						<div className="hidden lg:block overflow-x-auto ">
							<table className="w-full text-sm min-w-[640px]">
								<thead>
									<tr className="border-b border-white/10 bg-black/20">
										<th className="px-3 py-3 text-left font-semibold text-zinc-300 w-10">
											#
										</th>
										<th className="px-3 py-3 text-left font-semibold text-zinc-300">
											Product Name
										</th>
										<th className="px-3 py-3 text-left font-semibold text-zinc-300 hidden sm:table-cell">
											Category
										</th>
										<th className="px-3 py-3 text-left font-semibold text-zinc-300">
											Price
										</th>
										<th className="px-3 py-3 text-left font-semibold text-zinc-300">
											Stock
										</th>
										<th className="px-3 py-3 text-left font-semibold text-zinc-300 hidden md:table-cell">
											Threshold
										</th>
										<th className="px-3 py-3 text-left font-semibold text-zinc-300 hidden sm:table-cell">
											Status
										</th>
										<th className="px-3 py-3 text-left font-semibold text-zinc-300">
											Actions
										</th>
									</tr>
								</thead>
								<tbody>
									{isLoading
										? Array.from({ length: 8 }).map(
												(_, i) => (
													<tr
														key={i}
														className="border-b border-white/5"
													>
														{Array.from({
															length: 8,
														}).map((_, j) => (
															<td
																key={j}
																className="px-3 py-3"
															>
																<div className="h-4 w-12 bg-white/10 rounded animate-pulse" />
															</td>
														))}
													</tr>
												),
											)
										: products.map((product, idx) => {
												const isLowStock =
													product.stock > 0 &&
													product.stock <=
														product.minStockThreshold;
												const isOutOfStock =
													product.stock === 0;

												return (
													<tr
														key={product._id}
														className="border-b border-white/5 hover:bg-white/5"
													>
														<td className="px-3 py-3 text-zinc-400 text-xs">
															{(page - 1) *
																LIMIT +
																idx +
																1}
														</td>
														<td className="px-3 py-3 text-white font-medium">
															{product.name}
														</td>
														<td className="px-3 py-3 text-zinc-400 hidden sm:table-cell">
															{typeof product.category ===
															"string"
																? product.category
																: product
																		.category
																		?.name}
														</td>
														<td className="px-3 py-3 text-white">
															$
															{product.price.toFixed(
																2,
															)}
														</td>
														<td
															className={`px-3 py-3 font-medium ${isOutOfStock ? "text-red-400" : isLowStock ? "text-amber-400" : "text-green-400"}`}
														>
															<div className="flex items-center gap-1">
																{product.stock}
																{isLowStock && (
																	<span
																		title="Stock is low — contact admin to restock"
																		className="px-1 text-amber-400 cursor-help"
																	>
																		<AlertTriangle className="w-4 h-4" />
																	</span>
																)}
															</div>
														</td>
														<td className="px-3 py-3 text-zinc-400 hidden md:table-cell">
															{
																product.minStockThreshold
															}
														</td>
														<td className="px-3 py-3 hidden sm:table-cell">
															<span
																className={`px-2 py-1 rounded-full text-xs font-medium border ${product.status === "Active" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}
															>
																{product.status}
															</span>
														</td>
														<td className="px-3 py-3">
															<div className="flex items-center gap-1.5">
																<button
																	onClick={() =>
																		handleEditClick(
																			product,
																		)
																	}
																	className="p-1.5 rounded hover:bg-blue-500/20 text-blue-400 transition"
																	title="Edit"
																>
																	<Pencil className="w-4 h-4" />
																</button>

																<button
																	onClick={() =>
																		handleDeleteClick(
																			product,
																		)
																	}
																	className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition"
																	title="Delete"
																>
																	<Trash2 className="w-4 h-4" />
																</button>
																{isLowStock && (
																	<button
																		onClick={() =>
																			handleRestockClick(
																				product,
																			)
																		}
																		className="p-1.5 rounded hover:bg-amber-500/20 text-amber-400 transition"
																		title="Restock"
																	>
																		<ArrowUp className="w-4 h-4" />
																	</button>
																)}
															</div>
														</td>
													</tr>
												);
											})}
								</tbody>
							</table>
						</div>

						{/* Mobile Cards for small screens */}
						<div className="block lg:hidden space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
							{isLoading
								? Array.from({ length: 4 }).map((_, i) => (
										<div
											key={i}
											className="bg-[#1b1e28] p-4 rounded-xl animate-pulse space-y-2"
										>
											<div className="h-4 w-32 bg-white/10 rounded" />
											<div className="h-4 w-24 bg-white/10 rounded" />
											<div className="h-4 w-14 bg-white/10 rounded" />
										</div>
									))
								: products.map((product, idx) => {
										const isLowStock =
											product.stock > 0 &&
											product.stock <=
												product.minStockThreshold;
										const isOutOfStock =
											product.stock === 0;

										return (
											<div
												key={product._id}
												className="bg-[#1b1e28] p-4 rounded-xl space-y-2"
											>
												<div className="flex justify-between items-start">
													<p className="text-white font-semibold">
														{product.name}
													</p>
													<span
														className={`px-2 py-1 rounded-full text-xs font-medium border ${product.status === "Active" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}
													>
														{product.status}
													</span>
												</div>
												<p className="text-zinc-400 text-xs">
													Category:{" "}
													{typeof product.category ===
													"string"
														? product.category
														: product.category
																?.name}
												</p>
												<p className="text-white text-sm">
													Price: $
													{product.price.toFixed(2)}
												</p>
												<p
													className={`text-sm font-medium ${isOutOfStock ? "text-red-400" : isLowStock ? "text-amber-400" : "text-green-400"}`}
												>
													Stock: {product.stock}{" "}
													{isOutOfStock && "(Out)"}{" "}
													{isLowStock &&
														!isOutOfStock &&
														"(Low)"}
												</p>
												<div className="flex gap-2 mt-2">
													<button
														onClick={() =>
															handleEditClick(
																product,
															)
														}
														className="p-1.5 rounded hover:bg-blue-500/20 text-blue-400 transition"
													>
														<Pencil className="w-4 h-4" />
													</button>
													{isLowStock &&
														user?.role ===
															"user" && (
															<span
																title="Stock is low — contact admin to restock"
																className="p-1.5 text-amber-400 cursor-help"
															>
																<AlertTriangle className="w-4 h-4" />
															</span>
														)}

													{/* Restock button for admin/manager/super_admin */}
													{isLowStock &&
														user?.role !==
															"user" && (
															<button
																onClick={() =>
																	handleRestockClick(
																		product,
																	)
																}
																className="p-1.5 rounded hover:bg-amber-500/20 text-amber-400 transition"
																title="Restock"
															>
																<ArrowUp className="w-4 h-4" />
															</button>
														)}
													<button
														onClick={() =>
															handleDeleteClick(
																product,
															)
														}
														className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition"
													>
														<Trash2 className="w-4 h-4" />
													</button>
												</div>
											</div>
										);
									})}
						</div>

						{/* Pagination */}
						{!isLoading && (
							<div className="flex flex-col sm:flex-row items-center justify-between px-4 py-4 border-t border-white/10 gap-4">
								{/* Status Text - Centered on mobile, left-aligned on desktop */}
								<div className="text-xs sm:text-sm text-zinc-400 whitespace-nowrap order-2 sm:order-1">
									Showing {(page - 1) * LIMIT + 1}–
									{Math.min(page * LIMIT, total)} of {total}
								</div>

								{/* Buttons Container */}
								<div className="flex items-center gap-1 sm:gap-1.5 order-1 sm:order-2">
									<button
										onClick={() =>
											setPage(Math.max(1, page - 1))
										}
										disabled={page === 1}
										className="p-2 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
									>
										<ChevronLeft className="w-4 h-4 text-zinc-400" />
									</button>

									{Array.from({ length: totalPages }).map(
										(_, i) => {
											const pageNum = i + 1;

											// Configuration: Show 1 sibling on mobile, 2 on desktop
											// Mobile (sm): [1] ... [4] [5] [6] ... [20]
											// Desktop: [1] ... [3] [4] [5] [6] [7] ... [20]
											const isFirstPage = pageNum === 1;
											const isLastPage =
												pageNum === totalPages;

											// Use a small trick: hidden by default on mobile unless it's a "neighbor"
											const isNeighbor =
												Math.abs(pageNum - page) <= 1;
											const isDesktopNeighbor =
												Math.abs(pageNum - page) <= 2;

											// Logic to decide if we hide the button
											if (
												!isFirstPage &&
												!isLastPage &&
												!isNeighbor
											) {
												// Add a hidden-on-mobile class for the extra desktop neighbors
												const desktopOnlyClass =
													isDesktopNeighbor
														? "hidden md:inline-flex"
														: "hidden";

												// Show ellipsis only at specific break points
												if (
													pageNum === 2 ||
													pageNum === totalPages - 1
												) {
													return (
														<span
															key={`sep-${pageNum}`}
															className={`text-zinc-600 px-1 ${desktopOnlyClass === "hidden" ? "hidden sm:inline" : ""}`}
														>
															...
														</span>
													);
												}
												return null;
											}

											return (
												<button
													key={pageNum}
													onClick={() =>
														setPage(pageNum)
													}
													className={`min-w-[32px] h-8 flex items-center justify-center rounded text-xs sm:text-sm transition-all ${
														page === pageNum
															? "bg-indigo-600 text-white font-medium"
															: "hover:bg-white/10 text-zinc-400"
													} ${!isFirstPage && !isLastPage && !isNeighbor ? "hidden md:flex" : "flex"}`}
												>
													{pageNum}
												</button>
											);
										},
									)}

									<button
										onClick={() =>
											setPage(
												Math.min(totalPages, page + 1),
											)
										}
										disabled={page === totalPages}
										className="p-2 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
									>
										<ChevronRight className="w-4 h-4 text-zinc-400" />
									</button>
								</div>
							</div>
						)}
					</div>
				)}

				{/* Modals */}
				<AddEditProductDialog
					open={addDialogOpen || editDialogOpen}
					onOpenChange={(open) => {
						if (!open) {
							setAddDialogOpen(false);
							setEditDialogOpen(false);
							setSelectedProduct(null);
						}
					}}
					product={editDialogOpen ? selectedProduct : null}
					categories={categories}
					onSubmit={
						editDialogOpen ? handleEditProduct : handleAddProduct
					}
					isLoading={
						editDialogOpen
							? updateMutation.isPending
							: createMutation.isPending
					}
				/>

				{selectedProduct && (
					<>
						<DeleteProductDialog
							open={deleteDialogOpen}
							onOpenChange={setDeleteDialogOpen}
							onConfirm={handleDeleteProduct}
							productName={selectedProduct.name}
							isLoading={deleteMutation.isPending}
						/>

						<RestockProductDialog
							open={restockDialogOpen}
							onOpenChange={setRestockDialogOpen}
							onConfirm={handleRestockProduct}
							product={selectedProduct}
							isLoading={restockMutation.isPending}
						/>
					</>
				)}
			</motion.div>
		);
}
