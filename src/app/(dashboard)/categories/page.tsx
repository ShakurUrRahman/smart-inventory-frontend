"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Package, Pencil, Info, X } from "lucide-react";
import { SkeletonGrid } from "@/components/shared/Skeleton";
import { AddCategoryDialog } from "@/components/categories/AddCategoryDialog";
import { UpdateCategoryDialog } from "@/components/categories/UpdateCategoryDialog";
import { categoriesApi, Category } from "@/lib/categoriesApi";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { DeleteCategoryDialog } from "@/components/categories/DeleteCategoryDialog";
import { useAuthStore } from "@/store/authStore";
import usePermissions from "@/hooks/usePermissions";

export default function CategoriesPage() {
	const queryClient = useQueryClient();
	const { user } = useAuthStore();
	const { isUser, canCreateCategory, canUpdateCategory, canDeleteCategory } =
		usePermissions();

	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<Category | null>(
		null,
	);
	const [bannerDismissed, setBannerDismissed] = useState(true);

	// ─── Permission checks ────────────────────────────────────────────────────
	const isAdminOrSuper =
		user?.role === "admin" || user?.role === "super_admin";

	// ─── Queries ──────────────────────────────────────────────────────────────
	const { data: categories = [], isLoading } = useQuery({
		queryKey: ["categories"],
		queryFn: categoriesApi.getAllCategories,
	});

	// ─── Mutations ────────────────────────────────────────────────────────────
	const createMutation = useMutation({
		mutationFn: (data: { name: string }) =>
			categoriesApi.createCategory(data),
		onSuccess: () => {
			setAddDialogOpen(false);
			queryClient.invalidateQueries({ queryKey: ["categories"] });

			toast.success("Category created successfully!");
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, data }: { id: string; data: { name: string } }) =>
			categoriesApi.updateCategory(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["categories"] });
			setUpdateDialogOpen(false);
			setSelectedCategory(null);
			toast.success("Category updated successfully!");
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => categoriesApi.deleteCategory(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["categories"] });
			setDeleteDialogOpen(false);
			setSelectedCategory(null);
			toast.success("Category deleted successfully!");
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const handleAddCategory = async (data: { name: string }) => {
		await createMutation.mutateAsync(data);
	};

	const handleUpdateCategory = async (data: { name: string }) => {
		if (selectedCategory) {
			await updateMutation.mutateAsync({
				id: selectedCategory._id,
				data,
			});
		}
	};

	const handleDeleteCategory = async () => {
		if (selectedCategory) {
			await deleteMutation.mutateAsync(selectedCategory._id);
		}
	};

	const handleEditClick = (category: Category) => {
		setSelectedCategory(category);
		setUpdateDialogOpen(true);
	};

	const handleDeleteClick = (category: Category) => {
		setSelectedCategory(category);
		setDeleteDialogOpen(true);
	};

	const isEmpty = categories.length === 0 && !isLoading;

	return (
		<>
			<PageHeader
				title="Categories"
				subtitle="Organize your products with categories"
				action={
					canCreateCategory ? (
						<Button
							onClick={() => setAddDialogOpen(true)}
							className="bg-indigo-600 hover:bg-indigo-500 gap-2"
						>
							<Plus className="w-4 h-4" />
							<span className="hidden sm:inline">
								Add Category
							</span>
						</Button>
					) : null
				}
			/>

			{isUser && bannerDismissed && (
				<motion.div
					initial={{ opacity: 0, y: -8 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -8 }}
					className="flex items-start gap-3 px-4 py-3 mb-6 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300"
				>
					<Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />
					<p className="flex-1">
						You can browse categories but cannot create, edit, or
						delete them.
					</p>
					<button
						onClick={() => setBannerDismissed(false)}
						className="text-blue-400 hover:text-blue-200 transition-colors flex-shrink-0"
					>
						<X className="w-4 h-4" />
					</button>
				</motion.div>
			)}

			{/* Loading State */}
			{isLoading && <SkeletonGrid count={6} variant="card" />}

			{/* Empty State */}
			{isEmpty && (
				<div className="flex flex-col items-center justify-center py-16 px-4">
					<div className="text-center">
						<div className="text-5xl mb-4">📁</div>
						<h3 className="text-lg font-semibold text-white mb-2">
							No categories yet
						</h3>
						<p className="text-zinc-400 mb-6">
							{canCreateCategory
								? "Create your first category to organize your products."
								: "No categories have been created yet."}
						</p>
						{canCreateCategory && (
							<Button
								onClick={() => setAddDialogOpen(true)}
								className="bg-indigo-600 hover:bg-indigo-500 gap-2"
							>
								<Plus className="w-4 h-4" />
								Create First Category
							</Button>
						)}
					</div>
				</div>
			)}

			{/* Categories Grid */}
			{!isEmpty && (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
					<AnimatePresence mode="popLayout">
						{categories.map((category) => (
							<motion.div
								key={category._id}
								layout
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.9 }}
								transition={{ duration: 0.2 }}
							>
								<div className="group relative bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5 backdrop-blur hover:border-white/20 transition-all duration-200 overflow-hidden">
									<div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-indigo-500/0 group-hover:from-indigo-500/5 group-hover:to-indigo-500/5 transition-all duration-300" />

									<div className="relative z-10">
										<div className="flex items-start justify-between mb-4">
											<div className="flex items-start gap-3 flex-1 min-w-0">
												<div className="p-2.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex-shrink-0">
													<Package className="w-5 h-5 text-indigo-400" />
												</div>
												<div className="flex-1 min-w-0">
													<h3 className="text-base font-semibold text-white truncate">
														{category.name}
													</h3>
												</div>
											</div>

											{/* Action buttons */}
											{(canUpdateCategory ||
												canDeleteCategory) && (
												<div className="flex items-center gap-1 ml-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
													{canUpdateCategory && (
														<button
															onClick={() =>
																handleEditClick(
																	category,
																)
															}
															className="p-1.5 rounded-lg hover:bg-indigo-500/20 text-zinc-400 hover:text-indigo-300 transition-colors"
															disabled={
																updateMutation.isPending
															}
															title="Rename category"
														>
															<Pencil className="w-4 h-4" />
														</button>
													)}
													{canDeleteCategory && (
														<button
															onClick={() =>
																handleDeleteClick(
																	category,
																)
															}
															className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-300 transition-colors"
															disabled={
																deleteMutation.isPending
															}
															title="Delete category"
														>
															<Trash2 className="w-4 h-4" />
														</button>
													)}
												</div>
											)}
										</div>

										<div className="text-sm text-zinc-400">
											{category.productCount === 0
												? "No products"
												: `${category.productCount} product${category.productCount !== 1 ? "s" : ""}`}
										</div>
									</div>
								</div>
							</motion.div>
						))}
					</AnimatePresence>
				</div>
			)}

			{/* Dialogs */}
			{canCreateCategory && (
				<AddCategoryDialog
					open={addDialogOpen}
					onOpenChange={setAddDialogOpen}
					onSubmit={handleAddCategory}
					isLoading={createMutation.isPending}
				/>
			)}

			{canUpdateCategory && (
				<UpdateCategoryDialog
					open={updateDialogOpen}
					onOpenChange={setUpdateDialogOpen}
					onSubmit={handleUpdateCategory}
					isLoading={updateMutation.isPending}
					category={selectedCategory}
				/>
			)}

			{canDeleteCategory && selectedCategory && (
				<DeleteCategoryDialog
					open={deleteDialogOpen}
					onOpenChange={setDeleteDialogOpen}
					onConfirm={handleDeleteCategory}
					categoryName={selectedCategory.name}
					isLoading={deleteMutation.isPending}
				/>
			)}
		</>
	);
}
