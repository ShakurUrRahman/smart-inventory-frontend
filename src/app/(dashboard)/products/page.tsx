"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkeletonGrid } from "@/components/shared/Skeleton";
import { categoriesApi } from "@/lib/categoriesApi";
import { productsApi, Product } from "@/lib/productsApi";
import { toast } from "sonner";

import {
	AddEditProductDialog,
	DeleteProductDialog,
	RestockProductDialog,
} from "@/components/products/ProductModals";
import { useDebounce } from "@/hooks/useSearch";

export default function ProductsPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const queryClient = useQueryClient();

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

	const handleAddProduct = (payload: any) =>
		createMutation.mutateAsync(payload);
	const handleEditProduct = (payload: any) => {
		if (selectedProduct) {
			updateMutation.mutateAsync({ id: selectedProduct._id, payload });
		}
	};
	const handleDeleteProduct = async () => {
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

	const products = productsData?.data || [];
	const total = productsData?.total || 0;
	const totalPages = productsData?.totalPages || 1;
	const isEmpty = products.length === 0 && !isLoading;

	return (
		<>
			<PageHeader
				title="Products"
				subtitle={`${total} total product${total !== 1 ? "s" : ""}`}
				action={
					<Button
						onClick={() => setAddDialogOpen(true)}
						className="bg-indigo-600 hover:bg-indigo-500 gap-2"
					>
						<Plus className="w-4 h-4" />
						Add Product
					</Button>
				}
			/>

			{/* Filter Bar */}
			<div className="bg-[#13161F] border border-white/10 rounded-xl p-4 mb-6 space-y-4">
				{/* Search */}
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
					<Input
						placeholder="Search products..."
						value={search}
						onChange={(e) => handleSearchChange(e.target.value)}
						className="pl-10 bg-[#1C1F2A] border-zinc-700/60"
					/>
				</div>

				{/* Category & Status Filters */}
				<div className="flex gap-4 flex-wrap">
					{/* Category Dropdown */}
					<select
						value={categoryFilter}
						onChange={(e) => {
							setCategoryFilter(e.target.value);
							setPage(1);
							updateUrl(search, e.target.value, statusFilter, 1);
						}}
						className="px-3 py-2 rounded-lg bg-[#1C1F2A] border border-zinc-700/60 text-white text-sm"
					>
						<option value="">All Categories</option>
						{categories.map((cat) => (
							<option key={cat._id} value={cat._id}>
								{cat.name}
							</option>
						))}
					</select>

					{/* Status Filter */}
					<div className="flex gap-2">
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
								className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
									statusFilter === status
										? "bg-indigo-600 text-white"
										: "bg-[#1C1F2A] border border-zinc-700/60 text-zinc-300 hover:bg-white/10"
								}`}
							>
								{status || "All Status"}
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
				<div className="bg-[#13161F] border border-white/10 rounded-xl overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-white/10 bg-black/20">
									<th className="px-4 py-3 text-left font-semibold text-zinc-300">
										#
									</th>
									<th className="px-4 py-3 text-left font-semibold text-zinc-300">
										Product Name
									</th>
									<th className="px-4 py-3 text-left font-semibold text-zinc-300">
										Category
									</th>
									<th className="px-4 py-3 text-left font-semibold text-zinc-300">
										Price
									</th>
									<th className="px-4 py-3 text-left font-semibold text-zinc-300">
										Stock
									</th>
									<th className="px-4 py-3 text-left font-semibold text-zinc-300">
										Threshold
									</th>
									<th className="px-4 py-3 text-left font-semibold text-zinc-300">
										Status
									</th>
									<th className="px-4 py-3 text-left font-semibold text-zinc-300">
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
												<td className="px-4 py-3">
													<div className="h-4 w-6 bg-white/10 rounded animate-pulse" />
												</td>
												<td className="px-4 py-3">
													<div className="h-4 w-40 bg-white/10 rounded animate-pulse mb-1.5" />
													<div className="h-3 w-24 bg-white/10 rounded animate-pulse" />
												</td>
												<td className="px-4 py-3">
													<div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
												</td>
												<td className="px-4 py-3">
													<div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
												</td>
												<td className="px-4 py-3">
													<div className="h-4 w-12 bg-white/10 rounded animate-pulse" />
												</td>
												<td className="px-4 py-3">
													<div className="h-4 w-12 bg-white/10 rounded animate-pulse" />
												</td>
												<td className="px-4 py-3">
													<div className="h-6 w-20 bg-white/10 rounded-full animate-pulse" />
												</td>
												<td className="px-4 py-3">
													<div className="h-8 w-20 bg-white/10 rounded animate-pulse" />
												</td>
											</tr>
										))
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
													<td className="px-4 py-3 text-zinc-400">
														{(page - 1) * LIMIT +
															idx +
															1}
													</td>
													<td className="px-4 py-3 text-white font-medium">
														{product.name}
													</td>
													<td className="px-4 py-3 text-zinc-400">
														{typeof product.category ===
														"string"
															? product.category
															: product.category
																	?.name}
													</td>
													<td className="px-4 py-3 text-white">
														$
														{product.price.toFixed(
															2,
														)}
													</td>
													<td
														className={`px-4 py-3 font-medium flex items-center gap-2 ${
															isOutOfStock
																? "text-red-400"
																: isLowStock
																	? "text-amber-400"
																	: "text-green-400"
														}`}
													>
														{isLowStock &&
															!isOutOfStock && (
																<AlertTriangle className="w-4 h-4" />
															)}
														{product.stock}
														{isOutOfStock && (
															<span className="ml-2 px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 border border-red-500/30">
																Out
															</span>
														)}
													</td>
													<td className="px-4 py-3 text-zinc-400">
														{
															product.minStockThreshold
														}
													</td>
													<td className="px-4 py-3">
														<span
															className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
																product.status ===
																"Active"
																	? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
																	: "bg-red-500/20 text-red-400 border-red-500/30"
															}`}
														>
															{product.status}
														</span>
													</td>
													<td className="px-4 py-3">
														<div className="flex items-center gap-2">
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

					{/* Pagination */}
					{!isLoading && (
						<div className="flex items-center justify-between px-4 py-4 border-t border-white/10">
							<div className="text-sm text-zinc-400">
								Showing {(page - 1) * LIMIT + 1}–
								{Math.min(page * LIMIT, total)} of {total}{" "}
								products
							</div>
							<div className="flex gap-2">
								<button
									onClick={() =>
										setPage(Math.max(1, page - 1))
									}
									disabled={page === 1}
									className="p-2 rounded hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<ChevronLeft className="w-4 h-4 text-zinc-400" />
								</button>

								{Array.from({ length: totalPages }).map(
									(_, i) => {
										const pageNum = i + 1;
										return (
											<button
												key={pageNum}
												onClick={() => setPage(pageNum)}
												className={`px-3 py-1 rounded text-sm ${
													page === pageNum
														? "bg-indigo-600 text-white"
														: "hover:bg-white/10 text-zinc-400"
												}`}
											>
												{pageNum}
											</button>
										);
									},
								)}

								<button
									onClick={() =>
										setPage(Math.min(totalPages, page + 1))
									}
									disabled={page === totalPages}
									className="p-2 rounded hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
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
				onSubmit={editDialogOpen ? handleEditProduct : handleAddProduct}
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
		</>
	);
}
