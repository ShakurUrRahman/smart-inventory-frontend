"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Category } from "@/lib/categoriesApi";
import { Product } from "@/lib/productsApi";

// Validation schemas
const productSchema = z.object({
	name: z.string().min(2, "Product name must be at least 2 characters"),
	category: z.string().min(1, "Category is required"),
	price: z.number().min(0, "Price must be non-negative"),
	stock: z.number().int().min(0, "Stock must be non-negative"),
	minStockThreshold: z.number().int().min(1, "Threshold must be at least 1"),
});

const editProductSchema = z.object({
	name: z.string().min(2, "Product name must be at least 2 characters"),
	category: z.string().min(1, "Category is required"),
	price: z.number().min(0, "Price must be non-negative"),
	minStockThreshold: z.number().int().min(1, "Threshold must be at least 1"),
});

const restockSchema = z.object({
	quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

type ProductFormData = z.infer<typeof productSchema>;
type EditProductFormData = z.infer<typeof editProductSchema>;
type RestockFormData = z.infer<typeof restockSchema>;

interface AddEditProductDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	product: Product | null;
	categories: Category[];
	onSubmit: (data: any) => Promise<void>;
	isLoading?: boolean;
}

interface DeleteProductDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => Promise<void>;
	productName: string;
	isLoading?: boolean;
}

interface RestockProductDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (quantity: number) => Promise<void>;
	product: Product;
	isLoading?: boolean;
}

export function AddEditProductDialog({
	open,
	onOpenChange,
	product,
	categories,
	onSubmit,
	isLoading = false,
}: AddEditProductDialogProps) {
	const isEdit = !!product;
	const {
		register,
		handleSubmit,
		watch,
		reset,
		formState: { errors },
	} = useForm<ProductFormData | EditProductFormData>({
		resolver: zodResolver(isEdit ? editProductSchema : productSchema),
		defaultValues: isEdit
			? {
					name: product.name,
					category: product.category._id,
					price: product.price,
					minStockThreshold: product.minStockThreshold,
				}
			: {
					price: 0,
					stock: 0,
					minStockThreshold: 1,
				},
	});

	useEffect(() => {
		if (product) {
			reset({
				name: product.name,
				category: product.category._id,
				price: product.price,
				minStockThreshold: product.minStockThreshold,
			});
		} else {
			reset({
				name: "",
				category: "",
				price: 0,
				stock: 0,
				minStockThreshold: 1,
			});
		}
	}, [product, reset]);

	const stock = watch("stock" as any);
	const minStockThreshold = watch("minStockThreshold");

	const getStatus = () => {
		if (isEdit) return product.status;
		return stock === 0 ? "Out of Stock" : "Active";
	};

	const handleFormSubmit = async (data: any) => {
		await onSubmit(data);
		reset();
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{isEdit ? "Edit Product" : "Add Product"}
					</DialogTitle>
					<DialogDescription>
						{isEdit
							? "Update product information"
							: "Create a new product for your inventory"}
					</DialogDescription>
				</DialogHeader>

				<form
					onSubmit={handleSubmit(handleFormSubmit)}
					className="space-y-4"
				>
					{/* Product Name */}
					<div className="space-y-1.5">
						<Label htmlFor="name" className="text-zinc-300">
							Product Name
						</Label>
						<Input
							id="name"
							placeholder="e.g., Laptop"
							className="bg-[#1C1F2A] border-zinc-700/60"
							disabled={isLoading}
							{...register("name")}
						/>
						{errors.name && (
							<p className="text-red-400 text-xs">
								{errors.name.message}
							</p>
						)}
					</div>

					{/* Category */}
					<div className="space-y-1.5">
						<Label htmlFor="category" className="text-zinc-300">
							Category
						</Label>
						<select
							id="category"
							className="w-full px-3 py-2 rounded-lg bg-[#1C1F2A] border border-zinc-700/60 text-white"
							disabled={isLoading}
							{...register("category")}
						>
							<option value="">Select Category</option>
							{categories.map((cat) => (
								<option key={cat._id} value={cat._id}>
									{cat.name}
								</option>
							))}
						</select>
						{errors.category && (
							<p className="text-red-400 text-xs">
								{errors.category.message}
							</p>
						)}
					</div>

					{/* Price */}
					<div className="space-y-1.5">
						<Label htmlFor="price" className="text-zinc-300">
							Price ($)
						</Label>
						<Input
							id="price"
							type="number"
							step="0.01"
							min="0"
							placeholder="0.00"
							className="bg-[#1C1F2A] border-zinc-700/60"
							disabled={isLoading}
							{...register("price", { valueAsNumber: true })}
						/>
						{errors.price && (
							<p className="text-red-400 text-xs">
								{errors.price.message}
							</p>
						)}
					</div>

					{/* Stock (only on add) */}
					{!isEdit && (
						<div className="space-y-1.5">
							<Label htmlFor="stock" className="text-zinc-300">
								Stock Quantity
							</Label>
							<Input
								id="stock"
								type="number"
								min="0"
								placeholder="0"
								className="bg-[#1C1F2A] border-zinc-700/60"
								disabled={isLoading}
								{...register("stock", { valueAsNumber: true })}
							/>
							{(errors as any).stock && (
								<p className="text-red-400 text-xs">
									{(errors as any).stock.message}
								</p>
							)}
						</div>
					)}

					{/* Min Stock Threshold */}
					<div className="space-y-1.5">
						<Label
							htmlFor="minStockThreshold"
							className="text-zinc-300"
						>
							Min Stock Threshold
						</Label>
						<Input
							id="minStockThreshold"
							type="number"
							min="1"
							placeholder="1"
							className="bg-[#1C1F2A] border-zinc-700/60"
							disabled={isLoading}
							{...register("minStockThreshold", {
								valueAsNumber: true,
							})}
						/>
						{errors.minStockThreshold && (
							<p className="text-red-400 text-xs">
								{errors.minStockThreshold.message}
							</p>
						)}
					</div>

					{/* Status Preview */}
					{!isEdit && (
						<div className="p-3 rounded-lg bg-white/5 border border-white/10">
							<p className="text-xs text-zinc-400">
								Status will be:{" "}
								<span className="font-semibold text-white">
									{getStatus()}
								</span>
							</p>
						</div>
					)}

					<div className="flex justify-end gap-2 pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isLoading}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							className="bg-indigo-600 hover:bg-indigo-500"
							disabled={isLoading}
						>
							{isLoading ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									{isEdit ? "Updating..." : "Creating..."}
								</>
							) : isEdit ? (
								"Update Product"
							) : (
								"Create Product"
							)}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export function DeleteProductDialog({
	open,
	onOpenChange,
	onConfirm,
	productName,
	isLoading = false,
}: DeleteProductDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Product?</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete{" "}
						<strong>{productName}</strong>? This action cannot be
						undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="flex justify-end gap-2">
					<AlertDialogCancel disabled={isLoading}>
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={onConfirm}
						disabled={isLoading}
						className={
							isLoading ? "opacity-50 cursor-not-allowed" : ""
						}
					>
						{isLoading ? "Deleting..." : "Delete"}
					</AlertDialogAction>
				</div>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export function RestockProductDialog({
	open,
	onOpenChange,
	onConfirm,
	product,
	isLoading = false,
}: RestockProductDialogProps) {
	const {
		register,
		handleSubmit,
		watch,
		reset,
		formState: { errors },
	} = useForm<RestockFormData>({
		resolver: zodResolver(restockSchema),
		defaultValues: { quantity: 10 },
	});

	const quantity = watch("quantity");
	const newStock = product.stock + quantity;

	const handleFormSubmit = async (data: RestockFormData) => {
		await onConfirm(data.quantity);
		reset();
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Restock Product</DialogTitle>
					<DialogDescription>
						Add quantity to {product.name}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* Current Stock Info */}
					<div className="p-3 rounded-lg bg-white/5 border border-white/10">
						<p className="text-xs text-zinc-400">Current Stock</p>
						<p className="text-2xl font-bold text-white">
							{product.stock} units
						</p>
					</div>

					<form
						onSubmit={handleSubmit(handleFormSubmit)}
						className="space-y-4"
					>
						{/* Quantity Input */}
						<div className="space-y-1.5">
							<Label htmlFor="quantity" className="text-zinc-300">
								Add Quantity
							</Label>
							<Input
								id="quantity"
								type="number"
								min="1"
								placeholder="10"
								className="bg-[#1C1F2A] border-zinc-700/60"
								disabled={isLoading}
								{...register("quantity", {
									valueAsNumber: true,
								})}
							/>
							{errors.quantity && (
								<p className="text-red-400 text-xs">
									{errors.quantity.message}
								</p>
							)}
						</div>

						{/* New Stock Preview */}
						<div className="p-3 rounded-lg bg-green-500/20 border border-green-500/30">
							<p className="text-xs text-green-400">
								New stock will be
							</p>
							<p className="text-2xl font-bold text-green-400">
								{newStock} units
							</p>
						</div>

						<div className="flex justify-end gap-2 pt-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={isLoading}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								className="bg-amber-600 hover:bg-amber-700"
								disabled={isLoading}
							>
								{isLoading ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										Restocking...
									</>
								) : (
									"Confirm Restock"
								)}
							</Button>
						</div>
					</form>
				</div>
			</DialogContent>
		</Dialog>
	);
}
