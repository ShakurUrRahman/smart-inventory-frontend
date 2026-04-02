"use client";

// app/(dashboard)/categories/page.tsx

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Package, Pencil } from "lucide-react";
import { SkeletonGrid } from "@/components/shared/Skeleton";
import { AddCategoryDialog } from "@/components/categories/AddCategoryDialog";
import { DeleteCategoryDialog } from "@/components/categories/DeleteCategoryDialog";
import { UpdateCategoryDialog } from "@/components/categories/UpdateCategoryDialog";
import { categoriesApi, Category } from "@/lib/categoriesApi";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function CategoriesPage() {
	const queryClient = useQueryClient();
	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<Category | null>(
		null,
	);

	// Fetch categories
	const { data: categories = [], isLoading } = useQuery({
		queryKey: ["categories"],
		queryFn: categoriesApi.getAllCategories,
	});

	// Create mutation
	const createMutation = useMutation({
		mutationFn: (data: { name: string }) =>
			categoriesApi.createCategory(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["categories"] });
			setAddDialogOpen(false);
			toast.success("Category created successfully!");
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	// Update mutation
	const updateMutation = useMutation({
		mutationFn: ({ id, data }: { id: string; data: { name: string } }) =>
			categoriesApi.updateCategory(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["categories"] });
			setUpdateDialogOpen(false);
			setSelectedCategory(null);
			toast.success("Category updated successfully!");
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	// Delete mutation
	const deleteMutation = useMutation({
		mutationFn: (id: string) => categoriesApi.deleteCategory(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["categories"] });
			setDeleteDialogOpen(false);
			setSelectedCategory(null);
			toast.success("Category deleted successfully!");
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
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
					<Button
						onClick={() => setAddDialogOpen(true)}
						className="bg-indigo-600 hover:bg-indigo-500 gap-2"
					>
						<Plus className="w-4 h-4" />
						Add Category
					</Button>
				}
			/>

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
							Create your first category to organize your
							products.
						</p>
						<Button
							onClick={() => setAddDialogOpen(true)}
							className="bg-indigo-600 hover:bg-indigo-500 gap-2"
						>
							<Plus className="w-4 h-4" />
							Create First Category
						</Button>
					</div>
				</div>
			)}

			{/* Categories Grid */}
			{!isEmpty && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
								<div className="group relative bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur hover:border-white/20 transition-all duration-200 overflow-hidden">
									{/* Hover gradient */}
									<div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-indigo-500/0 group-hover:from-indigo-500/5 group-hover:to-indigo-500/5 transition-all duration-300" />

									<div className="relative z-10">
										{/* Icon + Name + Actions */}
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

											{/* Action buttons — visible on hover */}
											<div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
												{/* Edit button */}
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

												{/* Delete button */}
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
											</div>
										</div>

										{/* Product Count */}
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

			{/* Add Dialog */}
			<AddCategoryDialog
				open={addDialogOpen}
				onOpenChange={setAddDialogOpen}
				onSubmit={handleAddCategory}
				isLoading={createMutation.isPending}
			/>

			{/* Update Dialog */}
			<UpdateCategoryDialog
				open={updateDialogOpen}
				onOpenChange={setUpdateDialogOpen}
				onSubmit={handleUpdateCategory}
				isLoading={updateMutation.isPending}
				category={selectedCategory}
			/>

			{/* Delete Dialog */}
			{selectedCategory && (
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
