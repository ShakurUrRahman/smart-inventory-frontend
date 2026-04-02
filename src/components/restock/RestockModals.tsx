"use client";

import { useState } from "react";
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
import { RestockQueueItem } from "@/lib/restockApi";

const restockSchema = z.object({
	quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

type RestockFormData = z.infer<typeof restockSchema>;

interface RestockModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	item: RestockQueueItem;
	onSubmit: (quantity: number) => Promise<void>;
	isLoading?: boolean;
}

interface RemoveConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	productName: string;
	onConfirm: () => Promise<void>;
	isLoading?: boolean;
}

export function RestockModal({
	open,
	onOpenChange,
	item,
	onSubmit,
	isLoading = false,
}: RestockModalProps) {
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
	const newStock = item.currentStock + quantity;
	const willResolve = newStock >= item.requiredStock;

	const handleFormSubmit = async (data: RestockFormData) => {
		await onSubmit(data.quantity);
		reset();
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Restock Product</DialogTitle>
					<DialogDescription>
						Add stock to {item.product.name}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* Current Info */}
					<div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
						<div>
							<p className="text-xs text-zinc-400">
								Current Stock
							</p>
							<p className="text-2xl font-bold text-red-400">
								{item.currentStock} units
							</p>
						</div>
						<div>
							<p className="text-xs text-zinc-400">
								Required Threshold
							</p>
							<p className="text-lg text-white">
								{item.requiredStock} units
							</p>
						</div>
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

						{/* Preview */}
						<div
							className={`p-3 rounded-lg border ${
								willResolve
									? "bg-green-500/20 border-green-500/30"
									: "bg-amber-500/20 border-amber-500/30"
							}`}
						>
							<p className="text-xs text-zinc-300 mb-1">
								New stock will be
							</p>
							<p className="text-2xl font-bold text-white">
								{newStock} units
							</p>
							<p
								className={`text-xs mt-2 ${
									willResolve
										? "text-green-400"
										: "text-amber-400"
								}`}
							>
								{willResolve
									? "✅ Will be removed from queue"
									: "⚠️ Still below threshold — will remain in queue"}
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
								className="bg-green-600 hover:bg-green-700"
								disabled={isLoading}
							>
								{isLoading ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										Restocking...
									</>
								) : (
									"Restock Now"
								)}
							</Button>
						</div>
					</form>
				</div>
			</DialogContent>
		</Dialog>
	);
}

export function RemoveConfirmDialog({
	open,
	onOpenChange,
	productName,
	onConfirm,
	isLoading = false,
}: RemoveConfirmDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Remove from queue?</AlertDialogTitle>
					<AlertDialogDescription>
						Remove <strong>{productName}</strong> from the restock
						queue? This won't change stock levels.
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
						{isLoading ? "Removing..." : "Remove"}
					</AlertDialogAction>
				</div>
			</AlertDialogContent>
		</AlertDialog>
	);
}
