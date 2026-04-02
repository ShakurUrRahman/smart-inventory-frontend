"use client";

import { useState, useMemo } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, X, Trash2, Plus } from "lucide-react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Product } from "@/lib/productsApi";
import { Category } from "@/lib/categoriesApi";
import { toast } from "sonner";

const orderSchema = z.object({
	customerName: z
		.string()
		.min(2, "Customer name must be at least 2 characters"),
	items: z.array(
		z.object({
			productId: z.string().min(1, "Product is required"),
			quantity: z.number().min(1, "Quantity must be at least 1"),
		}),
	),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface CreateOrderDrawerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	products: Product[];
	categories: Category[];
	onSubmit: (data: any) => Promise<void>;
	isLoading?: boolean;
}

export default function CreateOrderDrawer({
	open,
	onOpenChange,
	products,
	categories,
	onSubmit,
	isLoading = false,
}: CreateOrderDrawerProps) {
	const [inlineErrors, setInlineErrors] = useState<Record<string, string>>(
		{},
	);
	const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
		new Set(),
	);

	const {
		register,
		handleSubmit,
		control,
		watch,
		reset,
		formState: { errors, isValid },
	} = useForm<OrderFormData>({
		resolver: zodResolver(orderSchema),
		mode: "onChange",
		defaultValues: {
			customerName: "",
			items: [],
		},
	});

	const { fields, append, remove } = useFieldArray({
		control,
		name: "items",
	});

	const items = watch("items");
	const customerName = watch("customerName");

	// Calculate total price
	const totalPrice = useMemo(() => {
		return items.reduce((sum, item) => {
			const product = products.find((p) => p._id === item.productId);
			return sum + (product ? product.price * item.quantity : 0);
		}, 0);
	}, [items, products]);

	// Check for stock issues
	const stockIssues = useMemo(() => {
		const issues: Record<string, string> = {};
		items.forEach((item, idx) => {
			const product = products.find((p) => p._id === item.productId);
			if (product && item.quantity > product.stock) {
				issues[`item-${idx}`] = `Only ${product.stock} available`;
			}
		});
		return issues;
	}, [items, products]);

	const handleAddProduct = (productId: string, quantity: number) => {
		// Check if already added
		if (selectedProducts.has(productId)) {
			setInlineErrors({
				...inlineErrors,
				"product-select": "⛔ This product is already added",
			});
			setTimeout(() => {
				setInlineErrors((prev) => ({ ...prev, "product-select": "" }));
			}, 3000);
			return;
		}

		// Check if available
		const product = products.find((p) => p._id === productId);
		if (!product || product.status !== "Active") {
			setInlineErrors({
				...inlineErrors,
				"product-select": "🚫 This product is currently unavailable",
			});
			setTimeout(() => {
				setInlineErrors((prev) => ({ ...prev, "product-select": "" }));
			}, 3000);
			return;
		}

		// Check stock
		if (quantity > product.stock) {
			setInlineErrors({
				...inlineErrors,
				"product-select": `⚠️ Only ${product.stock} items available`,
			});
			setTimeout(() => {
				setInlineErrors((prev) => ({ ...prev, "product-select": "" }));
			}, 3000);
			return;
		}

		// Add item
		append({
			productId,
			quantity: Math.max(1, quantity),
		});
		selectedProducts.add(productId);
		setSelectedProducts(new Set(selectedProducts));

		// Clear inline errors
		const newErrors = { ...inlineErrors };
		delete newErrors["product-select"];
		setInlineErrors(newErrors);
	};

	const handleRemoveItem = (index: number) => {
		const productId = items[index]?.productId;
		if (productId) {
			selectedProducts.delete(productId);
			setSelectedProducts(new Set(selectedProducts));
		}
		remove(index);
	};

	const handleFormSubmit = async (data: OrderFormData) => {
		if (Object.keys(stockIssues).length > 0) {
			toast.error("Cannot create order: stock issues exist");
			return;
		}

		try {
			await onSubmit({
				customerName: data.customerName,
				items: data.items.map((item) => ({
					productId: item.productId,
					quantity: item.quantity,
				})),
			});
			reset();
			setSelectedProducts(new Set());
		} catch (error: any) {
			// Error handling is done by the mutation
		}
	};

	const canSubmit = isValid && items.length > 0 && !isLoading;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="sm:max-w-xl overflow-y-auto bg-[#0a0d12]">
				<SheetHeader>
					<SheetTitle>Create Order</SheetTitle>
					<SheetDescription>
						Add products and customer information to create a new
						order
					</SheetDescription>
				</SheetHeader>

				<form
					onSubmit={handleSubmit(handleFormSubmit)}
					className="space-y-6 mt-6"
				>
					{/* SECTION 1: Customer Name */}
					<div className="space-y-3 pb-6 border-b border-white/10">
						<Label htmlFor="customerName" className="text-zinc-300">
							Customer Name
						</Label>
						<Input
							id="customerName"
							placeholder="e.g., John Smith"
							className="bg-[#1C1F2A] border-zinc-700/60"
							disabled={isLoading}
							{...register("customerName")}
						/>
						{errors.customerName && (
							<p className="text-red-400 text-xs">
								{errors.customerName.message}
							</p>
						)}
					</div>

					{/* SECTION 2: Add Products */}
					<div className="space-y-3 pb-6 border-b border-white/10">
						<Label className="text-zinc-300">Add Products</Label>

						<div className="space-y-3">
							<div className="flex gap-2">
								<ProductSelect
									products={products}
									selectedProducts={selectedProducts}
									onSelect={handleAddProduct}
									disabled={isLoading}
								/>
							</div>

							{inlineErrors["product-select"] && (
								<p className="text-red-400 text-xs">
									{inlineErrors["product-select"]}
								</p>
							)}
						</div>
					</div>

					{/* SECTION 3: Item List */}
					{fields.length > 0 && (
						<div className="space-y-3 pb-6 border-b border-white/10">
							<Label className="text-zinc-300">Order Items</Label>

							<div className="space-y-2">
								{fields.map((field, index) => {
									const product = products.find(
										(p) =>
											p._id === items[index]?.productId,
									);
									const itemTotal = product
										? product.price * items[index]?.quantity
										: 0;
									const hasStockWarning =
										stockIssues[`item-${index}`];

									return (
										<div
											key={field.id}
											className="space-y-2"
										>
											<div className="flex items-center justify-between bg-white/5 border border-white/10 p-3 rounded">
												<div>
													<p className="text-white text-sm">
														{product?.name ||
															"Unknown Product"}
													</p>
													<p className="text-zinc-400 text-xs">
														×
														{items[index]
															?.quantity ||
															0}{" "}
														@ $
														{product?.price.toFixed(
															2,
														)}
														= $
														{itemTotal.toFixed(2)}
													</p>
												</div>
												<button
													type="button"
													onClick={() =>
														handleRemoveItem(index)
													}
													className="p-1 hover:bg-red-500/20 text-red-400 rounded transition"
													disabled={isLoading}
												>
													<Trash2 className="w-4 h-4" />
												</button>
											</div>

											{hasStockWarning && (
												<p className="text-amber-400 text-xs flex items-center gap-1">
													⚠️ {hasStockWarning}
												</p>
											)}
										</div>
									);
								})}
							</div>
						</div>
					)}

					{/* Total */}
					{fields.length > 0 && (
						<div className="pb-6 border-b border-white/10">
							<div className="text-right">
								<p className="text-zinc-400 text-sm">Total</p>
								<p className="text-3xl font-bold text-white">
									${totalPrice.toFixed(2)}
								</p>
							</div>
						</div>
					)}

					{/* Submit */}
					<div className="flex gap-2 justify-end">
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
							disabled={!canSubmit}
						>
							{isLoading ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									Creating...
								</>
							) : (
								"Create Order"
							)}
						</Button>
					</div>
				</form>
			</SheetContent>
		</Sheet>
	);
}

function ProductSelect({
	products,
	selectedProducts,
	onSelect,
	disabled,
}: {
	products: Product[];
	selectedProducts: Set<string>;
	onSelect: (productId: string, quantity: number) => void;
	disabled?: boolean;
}) {
	const [selectedProductId, setSelectedProductId] = useState("");
	const [quantity, setQuantity] = useState(1);

	const availableProducts = products.filter(
		(p) => !selectedProducts.has(p._id) && p.status === "Active",
	);

	const handleAdd = () => {
		if (selectedProductId && quantity > 0) {
			onSelect(selectedProductId, quantity);
			setSelectedProductId("");
			setQuantity(1);
		}
	};

	return (
		<>
			<select
				value={selectedProductId}
				onChange={(e) => setSelectedProductId(e.target.value)}
				disabled={disabled || availableProducts.length === 0}
				className="flex-1 px-3 py-2 rounded-lg bg-[#1C1F2A] border border-zinc-700/60 text-white text-sm"
			>
				<option value="">Select a product...</option>
				{products.map((product) => (
					<option
						key={product._id}
						value={product._id}
						disabled={
							selectedProducts.has(product._id) ||
							product.status !== "Active"
						}
					>
						{product.name} (stock: {product.stock})
						{product.status !== "Active" && " - Unavailable"}
					</option>
				))}
			</select>

			<input
				type="number"
				min="1"
				value={quantity}
				onChange={(e) =>
					setQuantity(Math.max(1, parseInt(e.target.value) || 1))
				}
				disabled={disabled}
				className="w-20 px-2 py-2 rounded-lg bg-[#1C1F2A] border border-zinc-700/60 text-white text-sm"
				placeholder="Qty"
			/>

			<Button
				type="button"
				onClick={handleAdd}
				disabled={disabled || !selectedProductId || quantity < 1}
				className="bg-indigo-600 hover:bg-indigo-500 gap-1 px-3"
			>
				<Plus className="w-4 h-4" />
				Add
			</Button>
		</>
	);
}
