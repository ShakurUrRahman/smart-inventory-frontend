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
						<span className="hidden sm:inline">Add Product</span>
					</Button>
				}
			/>

			{/* Filter Bar */}
			{/* Filter Bar */}
			<div className="bg-[#13161F] border border-white/10 rounded-xl p-4 mb-6 space-y-3">
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
				<div className="flex flex-wrap gap-2">
					<select
						value={categoryFilter}
						onChange={(e) => {
							setCategoryFilter(e.target.value);
							setPage(1);
							updateUrl(search, e.target.value, statusFilter, 1);
						}}
						className="flex-1 min-w-[130px] px-3 py-2 rounded-lg bg-[#1C1F2A] border border-zinc-700/60 text-white text-sm"
					>
						<option value="">All Categories</option>
						{categories.map((cat) => (
							<option key={cat._id} value={cat._id}>
								{cat.name}
							</option>
						))}
					</select>

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
				<div className="bg-[#13161F] border border-white/10 rounded-xl overflow-hidden">
					<div className="hidden sm:block overflow-x-auto">
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
														className={`px-3 py-3 font-medium ${isOutOfStock ? "text-red-400" : isLowStock ? "text-amber-400" : "text-green-400"}`}
													>
														{product.stock}
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

					{/* Mobile Cards for small screens */}
					<div className="lg:hidden space-y-4 p-4">
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
									const isOutOfStock = product.stock === 0;

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
													: product.category?.name}
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
														handleEditClick(product)
													}
													className="p-1.5 rounded hover:bg-blue-500/20 text-blue-400 transition"
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
												onClick={() => setPage(pageNum)}
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
										setPage(Math.min(totalPages, page + 1))
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
