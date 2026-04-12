"use client";

import { useState, useMemo } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, X, Trash2, Plus, ShoppingCart } from "lucide-react";
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
import { cn } from "@/lib/utils";
import {
	Drawer,
	DrawerBody,
	DrawerClose,
	DrawerFooter,
	DrawerHeader,
} from "../shared/SheetDrawer";

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

	const {
		fields: fieldArr,
		append,
		remove,
	} = useFieldArray({
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
		<Drawer open={open} onOpenChange={onOpenChange}>
			<DrawerClose onClose={() => onOpenChange(false)} />

			<DrawerHeader>
				<div className="flex items-center gap-3">
					<div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
						<ShoppingCart className="w-4 h-4 text-indigo-400" />
					</div>
					<div>
						<h2 className="text-white font-semibold text-lg">
							Create Order
						</h2>
						<p className="text-zinc-400 text-sm">
							Add products and customer info
						</p>
					</div>
				</div>
			</DrawerHeader>

			<DrawerBody>
				<form
					id="create-order-form"
					onSubmit={handleSubmit(handleFormSubmit)}
					className="space-y-5"
				>
					{/* Customer Name */}
					<div className="space-y-2 pb-5 border-b border-white/10">
						<Label
							htmlFor="customerName"
							className="text-zinc-300 text-sm"
						>
							Customer Name
						</Label>
						<Input
							id="customerName"
							placeholder="e.g., John Smith"
							className="bg-[#1C1F2A] border-zinc-700/60 text-white placeholder:text-zinc-500"
							disabled={isLoading}
							{...register("customerName")}
						/>
						{errors.customerName && (
							<p className="text-red-400 text-xs">
								{errors.customerName.message}
							</p>
						)}
					</div>

					{/* Add Products */}
					<div className="space-y-2 pb-5 border-b border-white/10">
						<Label className="text-zinc-300 text-sm">
							Add Products
						</Label>
						<ProductSelect
							products={products}
							selectedProducts={selectedProducts}
							onSelect={handleAddProduct}
							disabled={isLoading}
						/>
						{inlineErrors["product-select"] && (
							<p className="text-red-400 text-xs">
								{inlineErrors["product-select"]}
							</p>
						)}
					</div>

					{/* Order Items */}
					{fieldArr.length > 0 && (
						<div className="space-y-2 pb-5 border-b border-white/10">
							<Label className="text-zinc-300 text-sm">
								Order Items
							</Label>
							<div className="space-y-2">
								{fieldArr.map((field, index) => {
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
											className="space-y-1.5"
										>
											<div className="flex items-center justify-between bg-white/5 border border-white/10 p-3 rounded-lg gap-3">
												<div className="flex-1 min-w-0">
													<p className="text-white text-sm font-medium truncate">
														{product?.name ||
															"Unknown Product"}
													</p>
													<p className="text-zinc-400 text-xs mt-0.5">
														×
														{items[index]
															?.quantity ||
															0}{" "}
														@ $
														{product?.price.toFixed(
															2,
														)}{" "}
														={" "}
														<span className="text-white font-medium">
															$
															{itemTotal.toFixed(
																2,
															)}
														</span>
													</p>
												</div>
												<button
													type="button"
													onClick={() =>
														handleRemoveItem(index)
													}
													className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition flex-shrink-0"
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
					{fieldArr.length > 0 && (
						<div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-4 py-3">
							<p className="text-zinc-400 text-sm">Order Total</p>
							<p className="text-2xl font-bold text-white">
								${totalPrice.toFixed(2)}
							</p>
						</div>
					)}
				</form>
			</DrawerBody>

			<DrawerFooter>
				<Button
					type="button"
					variant="outline"
					onClick={() => onOpenChange(false)}
					disabled={isLoading}
					className="w-full sm:w-auto border-zinc-700 text-zinc-300 hover:bg-white/5"
				>
					Cancel
				</Button>
				<Button
					type="submit"
					form="create-order-form"
					className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500"
					disabled={!canSubmit}
				>
					{isLoading ? (
						<>
							<Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
							Creating...
						</>
					) : (
						"Create Order"
					)}
				</Button>
			</DrawerFooter>
		</Drawer>
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
		<div className="flex flex-col sm:flex-row gap-2 w-full">
			<select
				value={selectedProductId}
				onChange={(e) => setSelectedProductId(e.target.value)}
				disabled={disabled || availableProducts.length === 0}
				className="flex-1 w-full px-3 py-2 rounded-lg bg-[#1C1F2A] border border-zinc-700/60 text-white text-sm focus:border-indigo-500 focus:outline-none"
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

			<div className="flex gap-2">
				<input
					type="number"
					min="1"
					value={quantity === 0 ? "" : quantity}
					onChange={(e) => {
						const val = e.target.value;
						if (val === "" || val === "0") {
							setQuantity(0); // allow empty/0 temporarily
						} else {
							setQuantity(Math.max(1, parseInt(val) || 0));
						}
					}}
					disabled={disabled}
					className="w-20 px-2 py-2 rounded-lg bg-[#1C1F2A] border border-zinc-700/60 text-white text-sm focus:border-indigo-500 focus:outline-none"
					placeholder="Qty"
				/>

				<Button
					type="button"
					onClick={handleAdd}
					disabled={disabled || !selectedProductId || quantity < 1} // ← quantity < 1 covers 0 and empty
					className="bg-indigo-600 hover:bg-indigo-500 gap-1 px-3 flex-shrink-0"
				>
					<Plus className="w-4 h-4" />
					<span className="hidden sm:inline">Add</span>
				</Button>
			</div>
		</div>
	);
}
