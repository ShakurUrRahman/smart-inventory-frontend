"use client";

import React, { useState, useMemo, useEffect } from "react";
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
	AlertCircle,
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
import usePermissions from "@/hooks/usePermissions";

// ─── Constants ────────────────────────────────────────────────────────────────

const LIMIT = 10;

const APPROVAL_BADGE: Record<string, { label: string; className: string }> = {
	approved: {
		label: "Approved",
		className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
	},
	pending: {
		label: "Pending",
		className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
	},
	rejected: {
		label: "Rejected",
		className: "bg-red-500/20 text-red-400 border-red-500/30",
	},
};

// ─── Shared Filter Bar ────────────────────────────────────────────────────────

function FilterBar({
	search,
	categoryFilter,
	statusFilter,
	categories,
	onSearchChange,
	onCategoryChange,
	onStatusChange,
}: {
	search: string;
	categoryFilter: string;
	statusFilter: string;
	categories: any[];
	onSearchChange: (v: string) => void;
	onCategoryChange: (v: string) => void;
	onStatusChange: (v: string) => void;
}) {
	return (
		<div className="bg-[#13161F] border border-white/10 rounded-xl p-4 mb-6 space-y-3">
			<div className="relative">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
				<Input
					placeholder="Search products..."
					value={search}
					onChange={(e) => onSearchChange(e.target.value)}
					className="pl-10 pr-9 bg-[#1C1F2A] border-zinc-700/60 focus:outline-none
					           focus:ring-0 data-[highlighted]:bg-white/10 placeholder:text-zinc-500
					           data-[highlighted]:text-white data-[highlighted]:outline-none
					           data-[highlighted]:ring-0"
				/>
				{search && (
					<button
						onClick={() => onSearchChange("")}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
					>
						<X className="w-4 h-4" />
					</button>
				)}
			</div>

			<div className="flex flex-wrap gap-2">
				<Select value={categoryFilter} onValueChange={onCategoryChange}>
					<SelectTrigger className="flex-1 border min-w-[130px] bg-[#1C1F2A] border-zinc-700/60 text-white text-sm">
						<SelectValue placeholder="All Categories" />
					</SelectTrigger>
					<SelectContent
						side="bottom"
						sideOffset={4}
						position="popper"
						avoidCollisions={false}
						className="bg-[#1C1F2A] border border-zinc-700/60 text-white w-[--radix-select-trigger-width] p-1"
					>
						<SelectItem
							value="all"
							className="focus:outline-none focus:ring-0 data-[highlighted]:bg-white/10 data-[highlighted]:text-white data-[highlighted]:outline-none data-[highlighted]:ring-0"
						>
							All Categories
						</SelectItem>
						{categories.map((cat) => (
							<SelectItem
								key={cat._id}
								value={cat._id}
								className="focus:outline-none focus:ring-0 data-[highlighted]:bg-white/10 data-[highlighted]:text-white data-[highlighted]:outline-none data-[highlighted]:ring-0"
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
							onClick={() => onStatusChange(status)}
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
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const queryClient = useQueryClient();
	const { user } = useAuthStore();
	const { isUser } = usePermissions();

	// Filters
	const [search, setSearch] = useState(searchParams.get("search") || "");
	const [categoryFilter, setCategoryFilter] = useState(
		searchParams.get("category") || "",
	);
	const [statusFilter, setStatusFilter] = useState(
		searchParams.get("status") || "",
	);
	const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
	const [userTab, setUserTab] = useState<
		"all" | "approved" | "pending" | "rejected"
	>("all");

	const [userPage, setUserPage] = useState(1);
	const USER_LIMIT = 6;

	const debouncedSearch = useDebounce(search, 300);

	// Dialog states
	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [restockDialogOpen, setRestockDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(
		null,
	);

	// Update URL
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

	const handleSearchChange = (value: string) => {
		setSearch(value);
		setPage(1);
		setUserPage(1);
		updateUrl(value, categoryFilter, statusFilter, 1);
	};
	const handleCategoryChange = (value: string) => {
		setCategoryFilter(value);
		setPage(1);
		updateUrl(search, value, statusFilter, 1);
	};
	const handleStatusChange = (value: string) => {
		setStatusFilter(value);
		setPage(1);
		updateUrl(search, categoryFilter, value, 1);
	};

	// Fetch categories
	const { data: categories = [] } = useQuery({
		queryKey: ["categories"],
		queryFn: categoriesApi.getAllCategories,
	});

	// Fetch products — backend filters by role automatically
	const { data: productsData, isLoading } = useQuery({
		queryKey: [
			"products",
			{ debouncedSearch, categoryFilter, statusFilter, page },
		],
		queryFn: () =>
			productsApi.getAllProducts({
				search: debouncedSearch || undefined,
				category:
					categoryFilter && categoryFilter !== "all"
						? categoryFilter
						: undefined,
				status: statusFilter || undefined,
				page,
				limit: LIMIT,
			}),
	});

	const products = productsData?.data || [];
	const total = productsData?.total || 0;
	const totalPages = productsData?.totalPages || 1;
	const isEmpty = products.length === 0 && !isLoading;

	// User tab counts — derived from all fetched products
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

	useEffect(() => {
		setUserPage(1);
	}, [userTab]);

	const currentTabProducts = useMemo(() => {
		if (userTab === "all") return products;
		return userProducts[userTab as keyof typeof userProducts] || [];
	}, [userTab, products, userProducts]);

	const paginatedTabProducts = useMemo(() => {
		const start = (userPage - 1) * USER_LIMIT;
		return currentTabProducts.slice(start, start + USER_LIMIT);
	}, [currentTabProducts, userPage]);

	const userTotalPages = Math.ceil(currentTabProducts.length / USER_LIMIT);

	// ── Mutations ─────────────────────────────────────────────────────────────
	const createMutation = useMutation({
		mutationFn: (payload: any) => productsApi.createProduct(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["products"] });
			setAddDialogOpen(false);
			toast.success(
				isUser
					? "Product submitted for approval!"
					: "Product created successfully!",
			);
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, payload }: any) =>
			productsApi.updateProduct(id, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["products"] });
			toast.success("Product updated successfully!");
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => productsApi.deleteProduct(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["products"] });
			setDeleteDialogOpen(false);
			setSelectedProduct(null);
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

	// ── Handlers ──────────────────────────────────────────────────────────────
	const handleAddProduct = (payload: any) => {
		createMutation.mutateAsync(payload);
		setAddDialogOpen(false);
	};
	const handleEditProduct = (payload: any) => {
		if (selectedProduct) {
			updateMutation.mutateAsync({ id: selectedProduct._id, payload });
			setEditDialogOpen(false); // ← close after success
			setSelectedProduct(null);
		}
	};
	const handleDeleteProduct = async () => {
		if (selectedProduct) {
			setDeleteDialogOpen(false);
			await deleteMutation.mutateAsync(selectedProduct._id);
		}
	};
	const handleRestockProduct = (quantity: number) => {
		if (selectedProduct) {
			setRestockDialogOpen(false);
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

	// ── Shared Pagination ─────────────────────────────────────────────────────
	const Pagination = () => (
		<div className="flex flex-col sm:flex-row items-center justify-between px-4 py-4 border-t border-white/10 gap-4">
			<div className="text-xs sm:text-sm text-zinc-400 order-2 sm:order-1">
				Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)}{" "}
				of {total}
			</div>
			<div className="flex items-center gap-1 sm:gap-1.5 order-1 sm:order-2">
				<button
					onClick={() => setPage(Math.max(1, page - 1))}
					disabled={page === 1}
					className="p-2 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
				>
					<ChevronLeft className="w-4 h-4 text-zinc-400" />
				</button>
				{Array.from({ length: totalPages }).map((_, i) => {
					const pageNum = i + 1;
					const isFirst = pageNum === 1;
					const isLast = pageNum === totalPages;
					const isNeighbor = Math.abs(pageNum - page) <= 1;
					const isDesktopNeighbor = Math.abs(pageNum - page) <= 2;
					if (!isFirst && !isLast && !isNeighbor) {
						if (pageNum === 2 || pageNum === totalPages - 1) {
							return (
								<span
									key={`sep-${pageNum}`}
									className="text-zinc-600 px-1 hidden sm:inline"
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
							onClick={() => setPage(pageNum)}
							className={`min-w-[32px] h-8 flex items-center justify-center rounded text-xs sm:text-sm transition-all ${
								page === pageNum
									? "bg-indigo-600 text-white font-medium"
									: "hover:bg-white/10 text-zinc-400"
							} ${!isFirst && !isLast && !isNeighbor ? "hidden md:flex" : "flex"}`}
						>
							{pageNum}
						</button>
					);
				})}
				<button
					onClick={() => setPage(Math.min(totalPages, page + 1))}
					disabled={page === totalPages}
					className="p-2 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
				>
					<ChevronRight className="w-4 h-4 text-zinc-400" />
				</button>
			</div>
		</div>
	);

	// ── Shared Modals ─────────────────────────────────────────────────────────
	const Modals = () => (
		<>
			<AddEditProductDialog
				open={addDialogOpen}
				onOpenChange={(open) => {
					if (!open) setAddDialogOpen(false);
				}}
				product={null}
				categories={categories}
				onSubmit={handleAddProduct}
				isLoading={createMutation.isPending}
			/>
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
				onSubmit={handleEditProduct}
				isLoading={updateMutation.isPending}
				warningBanner={
					isUser && selectedProduct?.approvalStatus === "approved" ? (
						<div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs mb-4">
							<AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
							Editing an approved product will reset it to pending
							and require re-approval.
						</div>
					) : isUser &&
					  selectedProduct?.approvalStatus === "rejected" ? (
						<div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs mb-4">
							<AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
							Updating this product will resubmit it for approval.
						</div>
					) : null
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
		</>
	);

	// ══════════════════════════════════════════════════════════════════════════
	// USER VIEW
	// ══════════════════════════════════════════════════════════════════════════
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
				<div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 overflow-x-auto hide-scrollbar mb-6">
					{[
						{
							value: "all",
							label: "All",
							icon: "📦",
							count: total,
						},
						{
							value: "approved",
							label: "Approved",
							icon: "✅",
							count: userProducts.approved.length,
						},
						{
							value: "pending",
							label: "Pending",
							icon: "⏳",
							count: userProducts.pending.length,
						},
						{
							value: "rejected",
							label: "Rejected",
							icon: "❌",
							count: userProducts.rejected.length,
						},
					].map((tab) => (
						<button
							key={tab.value}
							onClick={() => setUserTab(tab.value as any)}
							className="relative flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
						>
							{userTab === tab.value && (
								<motion.div
									layoutId="userProductTab"
									className="absolute inset-0 border-2 border-indigo-600 rounded-lg"
									transition={{
										type: "spring",
										stiffness: 400,
										damping: 35,
									}}
								/>
							)}
							<span className="relative z-10">{tab.icon}</span>
							<span
								className={`relative z-10 transition-colors ${
									userTab === tab.value
										? "text-white"
										: "text-zinc-400 hover:text-zinc-300"
								}`}
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

				{/* Filter Bar */}
				<FilterBar
					search={search}
					categoryFilter={categoryFilter}
					statusFilter={statusFilter}
					categories={categories}
					onSearchChange={handleSearchChange}
					onCategoryChange={handleCategoryChange}
					onStatusChange={handleStatusChange}
				/>

				{/* Tab Content */}
				<AnimatePresence mode="wait">
					<motion.div
						key={userTab}
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={{ duration: 0.2 }}
					>
						{isLoading ? (
							Array.from({ length: 10 }).map((_, i) => (
								<tr key={i} className="border-b border-white/5">
									{Array.from({ length: 20 }).map((_, j) => (
										<td key={j} className="px-3 py-3">
											<div className="h-4 w-12 bg-white/10 rounded animate-pulse" />
										</td>
									))}
								</tr>
							))
						) : paginatedTabProducts.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
								<div className="text-5xl mb-4">📦</div>
								<h3 className="text-lg font-semibold text-white mb-2">
									No {userTab === "all" ? "" : userTab}{" "}
									products yet
								</h3>
								<p className="text-zinc-400 mb-6 text-sm">
									{userTab === "approved"
										? "Your approved products will appear here."
										: userTab === "pending"
											? "Products awaiting review will appear here."
											: userTab === "rejected"
												? "Rejected products will appear here."
												: "Submit your first product to get started."}
								</p>
								{userTab !== "all" ? (
									<Button
										onClick={() => setUserTab("all")}
										className="bg-indigo-600 hover:bg-indigo-500"
									>
										View All Products
									</Button>
								) : (
									<Button
										onClick={() => setAddDialogOpen(true)}
										className="bg-indigo-600 hover:bg-indigo-500 gap-2"
									>
										<Plus className="w-4 h-4" />
										Submit First Product
									</Button>
								)}
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
												<th className="px-3 py-3 text-left font-semibold text-zinc-300 hidden md:table-cell">
													Status
												</th>
												<th className="px-3 py-3 text-left font-semibold text-zinc-300">
													Approval
												</th>
												<th className="px-3 py-3 text-left font-semibold text-zinc-300">
													Actions
												</th>
											</tr>
										</thead>
										<tbody>
											{paginatedTabProducts.map(
												(product: any, idx: number) => {
													const isLowStock =
														product.stock > 0 &&
														product.stock <=
															product.minStockThreshold;
													const isOutOfStock =
														product.stock === 0;
													const needsRestock =
														isLowStock ||
														isOutOfStock;
													const badge =
														APPROVAL_BADGE[
															product
																.approvalStatus
														] ?? {
															label: product.approvalStatus,
															className:
																"bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
														};

													return (
														<React.Fragment
															key={product._id}
														>
															<tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
																<td className="px-3 py-3 text-zinc-400 text-xs">
																	{idx + 1}
																</td>
																<td className="px-3 py-3 text-white font-medium">
																	<p className="truncate max-w-[180px]">
																		{
																			product.name
																		}
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
																	className={`px-3 py-3 font-medium ${isOutOfStock ? "text-red-400" : needsRestock ? "text-amber-400" : "text-green-400"}`}
																>
																	<div className="flex items-center gap-2">
																		{needsRestock &&
																			!isOutOfStock && (
																				<AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mb-0.5" />
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
																<td className="px-3 py-3 hidden sm:table-cell">
																	<span
																		className={`px-2 py-1 rounded-full text-xs font-medium border ${
																			product.status ===
																			"Active"
																				? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
																				: "bg-red-500/20 text-red-400 border-red-500/30"
																		}`}
																	>
																		{
																			product.status
																		}
																	</span>
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
																		{needsRestock && (
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
																				8
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
									{paginatedTabProducts.map(
										(product: any) => {
											const isLowStock =
												product.stock > 0 &&
												product.stock <=
													product.minStockThreshold;
											const isOutOfStock =
												product.stock === 0;
											const needsRestock =
												isLowStock || isOutOfStock;

											const badge = APPROVAL_BADGE[
												product.approvalStatus
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
													key={product._id}
													className={`bg-[#1b1e28] border ${borderClass} p-4 rounded-xl space-y-2.5`}
												>
													<div className="flex justify-between items-start gap-2">
														<p className="text-white font-semibold text-sm truncate">
															{product.name}
														</p>
														<span
															className={`px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${badge.className}`}
														>
															{badge.label}
														</span>
													</div>
													<p className="text-zinc-400 text-xs">
														{typeof product.category ===
														"string"
															? product.category
															: product.category
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
															className={`text-sm font-medium ${isOutOfStock ? "text-red-400" : needsRestock ? "text-amber-400" : "text-green-400"}`}
														>
															Stock:{" "}
															{product.stock}
															{isOutOfStock &&
																" (Out)"}
															{needsRestock &&
																!isOutOfStock &&
																" (Low)"}
														</p>
													</div>

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

													{product.approvalStatus ===
														"pending" && (
														<p className="text-zinc-500 text-xs italic">
															Awaiting review by
															admin or manager
														</p>
													)}

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
															<Trash2 className="w-3.5 h-3.5" />
															Delete
														</button>
													</div>
												</div>
											);
										},
									)}
								</div>
								{!isLoading &&
									currentTabProducts.length > USER_LIMIT && (
										<div className="flex flex-col sm:flex-row items-center justify-between px-4 py-4 border-t border-white/10 gap-4">
											<div className="text-xs sm:text-sm text-zinc-400 order-2 sm:order-1">
												Showing{" "}
												{(userPage - 1) * USER_LIMIT +
													1}
												–
												{Math.min(
													userPage * USER_LIMIT,
													currentTabProducts.length,
												)}{" "}
												of {currentTabProducts.length}
											</div>
											<div className="flex items-center gap-1 order-1 sm:order-2">
												<button
													onClick={() =>
														setUserPage(
															Math.max(
																1,
																userPage - 1,
															),
														)
													}
													disabled={userPage === 1}
													className="p-2 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
												>
													<ChevronLeft className="w-4 h-4 text-zinc-400" />
												</button>
												{Array.from({
													length: userTotalPages,
												}).map((_, i) => {
													const pageNum = i + 1;
													return (
														<button
															key={pageNum}
															onClick={() =>
																setUserPage(
																	pageNum,
																)
															}
															className={`min-w-[32px] h-8 flex items-center justify-center rounded text-xs sm:text-sm transition-all ${
																userPage ===
																pageNum
																	? "bg-indigo-600 text-white font-medium"
																	: "hover:bg-white/10 text-zinc-400"
															}`}
														>
															{pageNum}
														</button>
													);
												})}
												<button
													onClick={() =>
														setUserPage(
															Math.min(
																userTotalPages,
																userPage + 1,
															),
														)
													}
													disabled={
														userPage ===
														userTotalPages
													}
													className="p-2 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
												>
													<ChevronRight className="w-4 h-4 text-zinc-400" />
												</button>
											</div>
										</div>
									)}
							</div>
						)}
					</motion.div>
				</AnimatePresence>

				<Modals />
			</motion.div>
		);
	}

	// ══════════════════════════════════════════════════════════════════════════
	// ADMIN / MANAGER / SUPER_ADMIN VIEW
	// ══════════════════════════════════════════════════════════════════════════
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
						<span className="hidden sm:inline">Add Product</span>
					</Button>
				}
			/>

			{/* Filter Bar */}
			<FilterBar
				search={search}
				categoryFilter={categoryFilter}
				statusFilter={statusFilter}
				categories={categories}
				onSearchChange={handleSearchChange}
				onCategoryChange={handleCategoryChange}
				onStatusChange={handleStatusChange}
			/>

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
				<div className="lg:bg-[#13161F] lg:border lg:border-white/10 rounded-xl overflow-hidden">
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
									? Array.from({ length: 8 }).map((_, i) => (
											<tr
												key={i}
												className="border-b border-white/5"
											>
												{Array.from({ length: 8 }).map(
													(_, j) => (
														<td
															key={j}
															className="px-3 py-3"
														>
															<div className="h-4 w-12 bg-white/10 rounded animate-pulse" />
														</td>
													),
												)}
											</tr>
										))
									: products.map((product, idx) => {
											const isLowStock =
												product.stock > 0 &&
												product.stock <=
													product.minStockThreshold;
											const isOutOfStock =
												product.stock === 0;
											const needsRestock =
												isLowStock || isOutOfStock;
											return (
												<tr
													key={product._id}
													className="border-b border-white/5 hover:bg-white/5"
												>
													<td className="px-3 py-3 text-zinc-400 text-xs">
														{(page - 1) * LIMIT +
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
															: product.category
																	?.name}
													</td>
													<td className="px-3 py-3 text-white">
														$
														{product.price.toFixed(
															2,
														)}
													</td>
													<td
														className={`px-3 py-3 font-medium ${isOutOfStock ? "text-red-400" : needsRestock ? "text-amber-400" : "text-green-400"}`}
													>
														<div className="flex items-center gap-1">
															{product.stock}
															{needsRestock && (
																<AlertTriangle
																	className="w-3.5 h-3.5 text-amber-400 mb-0.5"
																	title="Low stock"
																/>
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
															className={`px-2 py-1 rounded-full text-xs font-medium border ${
																product.status ===
																"Active"
																	? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
																	: "bg-red-500/20 text-red-400 border-red-500/30"
															}`}
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
															{needsRestock && (
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
																title="Delete"
															>
																<Trash2 className="w-4 h-4" />
															</button>
														</div>
													</td>
												</tr>
											);
										})}
							</tbody>
						</table>
					</div>

					{/* Mobile Cards */}
					<div className="block lg:hidden space-y-3 p-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
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
							: products.map((product) => {
									const isLowStock =
										product.stock > 0 &&
										product.stock <=
											product.minStockThreshold;
									const isOutOfStock = product.stock === 0;
									const needsRestock =
										isLowStock || isOutOfStock;
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
													className={`px-2 py-1 rounded-full text-xs font-medium border ${
														product.status ===
														"Active"
															? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
															: "bg-red-500/20 text-red-400 border-red-500/30"
													}`}
												>
													{product.status}
												</span>
											</div>
											<p className="text-zinc-400 text-xs">
												{typeof product.category ===
												"string"
													? product.category
													: product.category?.name}
											</p>
											<p className="text-white text-sm">
												${product.price.toFixed(2)}
											</p>
											<p
												className={`text-sm font-medium ${isOutOfStock ? "text-red-400" : needsRestock ? "text-amber-400" : "text-green-400"}`}
											>
												Stock: {product.stock}
												{isOutOfStock && " (Out)"}
												{needsRestock &&
													!isOutOfStock &&
													" (Low)"}
											</p>
											<div className="flex gap-2 mt-2">
												<button
													onClick={() =>
														handleEditClick(product)
													}
													className="p-1.5 rounded hover:bg-blue-500/20 text-blue-400 transition"
												>
													<Pencil className="w-4 h-4" />
												</button>
												{needsRestock && (
													<button
														onClick={() =>
															handleRestockClick(
																product,
															)
														}
														className="p-1.5 rounded hover:bg-amber-500/20 text-amber-400 transition"
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

					{!isLoading && <Pagination />}
				</div>
			)}

			<Modals />
		</motion.div>
	);
}
