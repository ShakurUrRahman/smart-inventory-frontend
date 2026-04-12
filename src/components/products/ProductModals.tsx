"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Package, Trash2, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Category } from "@/lib/categoriesApi";
import { Product } from "@/lib/productsApi";
import {
	Modal,
	ModalBody,
	ModalFooter,
	ModalHeader,
} from "../shared/DialogModal";

// ─── Schemas ──────────────────────────────────────────────────────────────────
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

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface AddEditProductDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	product: Product | null;
	categories: Category[];
	onSubmit: (data: any) => Promise<void>;
	isLoading?: boolean;
	warningBanner?: React.ReactNode; // Added warningBanner prop
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

// ─── Add / Edit Dialog ────────────────────────────────────────────────────────
export function AddEditProductDialog({
	open,
	onOpenChange,
	product,
	categories,
	onSubmit,
	isLoading = false,
	warningBanner, // Destructure warningBanner
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

	const getStatus = () => {
		if (isEdit) return product.status;
		return stock === 0 ? "Out of Stock" : "Active";
	};

	const handleFormSubmit = async (data: any) => {
		await onSubmit(data);
		reset();
	};

	return (
		<Modal open={open} onOpenChange={onOpenChange}>
			{/* Header */}
			<div className="px-6 pt-6 pb-2">
				<div className="flex items-center gap-3">
					<div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
						<Package className="w-4 h-4 text-indigo-400" />
					</div>
					<div>
						<div className="text-white text-lg font-semibold">
							{isEdit ? "Edit Product" : "Add Product"}
						</div>
						<div className="text-zinc-400 text-sm mt-0.5">
							{isEdit
								? "Update product information"
								: "Create a new product for your inventory"}
						</div>
					</div>
				</div>
			</div>

			{/* Form */}
			<form
				onSubmit={handleSubmit(handleFormSubmit)}
				className="space-y-6"
			>
				{/* Body */}
				<ModalBody className="px-6 py-4 space-y-5">
					{/* Render Warning Banner here if it exists */}
					{warningBanner && (
						<div className="animate-in fade-in slide-in-from-top-2 duration-300">
							{warningBanner}
						</div>
					)}

					{/* Product Name */}
					<div className="space-y-2">
						<Label
							htmlFor="name"
							className="text-zinc-300 text-sm font-medium"
						>
							Product Name
						</Label>
						<Input
							id="name"
							placeholder="e.g., Laptop"
							className="bg-[#1C1F2A] border-zinc-700/60 text-white placeholder:text-zinc-600
                                focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 h-10"
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
					<div className="space-y-2">
						<Label
							htmlFor="category"
							className="text-zinc-300 text-sm font-medium"
						>
							Category
						</Label>
						<select
							id="category"
							className="w-full h-10 px-3 py-2 rounded-lg bg-[#1C1F2A] border border-zinc-700/60
							           text-white text-sm focus:border-indigo-500 focus:outline-none
							           focus:ring-2 focus:ring-indigo-500/20 transition-colors"
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

					{/* Price + Stock */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label
								htmlFor="price"
								className="text-zinc-300 text-sm font-medium"
							>
								Price ($)
							</Label>
							<Input
								id="price"
								type="number"
								step="0.01"
								min="0"
								placeholder="0.00"
								className="bg-[#1C1F2A] border-zinc-700/60 text-white placeholder:text-zinc-600
								           focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 h-10"
								disabled={isLoading}
								{...register("price", { valueAsNumber: true })}
							/>
							{errors.price && (
								<p className="text-red-400 text-xs">
									{errors.price.message}
								</p>
							)}
						</div>

						{!isEdit && (
							<div className="space-y-2">
								<Label
									htmlFor="stock"
									className="text-zinc-300 text-sm font-medium"
								>
									Stock Qty
								</Label>
								<Input
									id="stock"
									type="number"
									min="0"
									placeholder="0"
									className="bg-[#1C1F2A] border-zinc-700/60 text-white placeholder:text-zinc-600
									           focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 h-10"
									disabled={isLoading}
									{...register("stock", {
										valueAsNumber: true,
									})}
								/>
								{(errors as any).stock && (
									<p className="text-red-400 text-xs">
										{(errors as any).stock.message}
									</p>
								)}
							</div>
						)}
					</div>

					{/* Min Stock */}
					<div className="space-y-2">
						<Label
							htmlFor="minStockThreshold"
							className="text-zinc-300 text-sm font-medium"
						>
							Min Stock Threshold
						</Label>
						<Input
							id="minStockThreshold"
							type="number"
							min="1"
							placeholder="1"
							className="bg-[#1C1F2A] border-zinc-700/60 text-white placeholder:text-zinc-600
							           focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 h-10"
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
				</ModalBody>

				{/* Footer */}
				<ModalFooter className="px-6 pb-6 pt-4 border-t border-white/10">
					<div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 w-full">
						<Button
							type="button"
							variant="ghost"
							onClick={() => onOpenChange(false)}
							disabled={isLoading}
							className="bg-slate-600/70 hover:bg-slate-600"
						>
							Cancel
						</Button>

						<Button
							type="submit"
							disabled={isLoading}
							className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white"
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
				</ModalFooter>
			</form>
		</Modal>
	);
}

// ─── Delete Dialog ────────────────────────────────────────────────────────────
export function DeleteProductDialog({
	open,
	onOpenChange,
	onConfirm,
	productName,
	isLoading = false,
}: DeleteProductDialogProps) {
	return (
		<Modal open={open} onOpenChange={onOpenChange}>
			<ModalHeader>
				<div className="flex items-center gap-3 mb-1">
					<div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30">
						<Trash2 className="w-4 h-4 text-red-400" />
					</div>
					<div className="text-white text-lg font-semibold">
						Delete Product?
					</div>
				</div>
				<div className="text-zinc-400 text-sm pl-11">
					Are you sure you want to delete{" "}
					<span className="text-white font-medium">
						{productName}
					</span>
					? This action cannot be undone.
				</div>
			</ModalHeader>

			<ModalFooter>
				<div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4">
					<Button
						disabled={isLoading}
						onClick={() => onOpenChange(false)}
						className="bg-slate-600/70 hover:bg-slate-600"
					>
						Cancel
					</Button>
					<Button
						onClick={onConfirm}
						disabled={isLoading}
						className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white"
					>
						{isLoading ? "Deleting..." : "Delete Product"}
					</Button>
				</div>
			</ModalFooter>
		</Modal>
	);
}

// ─── Restock Dialog ───────────────────────────────────────────────────────────
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
	const newStock = product.stock + (quantity || 0);

	const handleFormSubmit = async (data: RestockFormData) => {
		await onConfirm(data.quantity);
		reset();
	};

	return (
		<Modal open={open} onOpenChange={onOpenChange}>
			<ModalHeader>
				<div className="mb-2">
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
							<ArrowUp className="w-4 h-4 text-amber-400" />
						</div>
						<div>
							<div className="text-white text-lg font-semibold">
								Restock Product
							</div>
							<div className="text-zinc-400 text-sm mt-0.5">
								Add stock to{" "}
								<span className="text-white font-medium">
									{product.name}
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Stock info — side by side on sm+ */}

				<div className="grid grid-cols-2 gap-3 my-4">
					<div className="p-3 rounded-lg bg-white/5 border border-white/10">
						<p className="text-xs text-zinc-400 mb-1">
							Current Stock
						</p>
						<p className="text-2xl font-bold text-white">
							{product.stock}
						</p>
						<p className="text-xs text-zinc-500">units</p>
					</div>
					<div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
						<p className="text-xs text-green-400 mb-1">New Stock</p>
						<p className="text-2xl font-bold text-green-400">
							{newStock}
						</p>
						<p className="text-xs text-green-500/70">units</p>
					</div>
				</div>
			</ModalHeader>

			<form
				onSubmit={handleSubmit(handleFormSubmit)}
				className="space-y-4"
			>
				<ModalBody>
					<div className="space-y-1.5">
						<Label
							htmlFor="quantity"
							className="text-zinc-300 text-sm font-medium"
						>
							Quantity to Add
						</Label>
						<Input
							id="quantity"
							type="number"
							min="1"
							placeholder="10"
							className="bg-[#1C1F2A] border-zinc-700/60 text-white placeholder:text-zinc-600
							           focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 h-10"
							disabled={isLoading}
							{...register("quantity", { valueAsNumber: true })}
						/>
						{errors.quantity && (
							<p className="text-red-400 text-xs">
								{errors.quantity.message}
							</p>
						)}
					</div>
				</ModalBody>

				<ModalFooter>
					<div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="ghost"
							onClick={() => onOpenChange(false)}
							disabled={isLoading}
							className="w-full sm:w-auto bg-slate-600/70 hover:bg-slate-600"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isLoading}
							className="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-white"
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
				</ModalFooter>
			</form>
		</Modal>
	);
}
