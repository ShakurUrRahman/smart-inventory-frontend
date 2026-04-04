"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowUp, Loader2, Trash2 } from "lucide-react";
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
	const safeQuantity = isNaN(quantity) || !quantity ? 0 : quantity; // ← add this
	const newStock = item.currentStock + safeQuantity;
	const willResolve = newStock >= item.product.minStockThreshold;

	const handleFormSubmit = async (data: RestockFormData) => {
		await onSubmit(data.quantity);
		reset();
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="
      w-[calc(100%-2rem)] sm:max-w-md
      bg-[#13151C] border border-white/10 text-white
      rounded-2xl p-4 sm:p-6
      max-h-[90dvh] overflow-y-auto
    "
			>
				<DialogHeader className="mb-2">
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-lg bg-green-500/20 border border-green-500/30">
							<ArrowUp className="w-4 h-4 text-green-400" />
						</div>
						<div>
							<DialogTitle className="text-white text-lg font-semibold">
								Restock Product
							</DialogTitle>
							<DialogDescription className="text-zinc-400 text-sm mt-0.5">
								Add stock to{" "}
								<span className="text-white font-medium">
									{item.product.name}
								</span>
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<div className="space-y-4 mt-2">
					{/* Current Info — side by side on sm+ */}
					<div className="grid grid-cols-2 gap-3">
						<div className="p-3 rounded-lg bg-white/5 border border-white/10">
							<p className="text-xs text-zinc-400 mb-1">
								Current Stock
							</p>
							<p className="text-2xl font-bold text-red-400">
								{item.currentStock}
							</p>
							<p className="text-xs text-zinc-500">units</p>
						</div>
						<div className="p-3 rounded-lg bg-white/5 border border-white/10">
							<p className="text-xs text-zinc-400 mb-1">
								Required Threshold
							</p>
							<p className="text-2xl font-bold text-white">
								{item.product.minStockThreshold}
							</p>
							<p className="text-xs text-zinc-500">units</p>
						</div>
					</div>

					<form
						onSubmit={handleSubmit(handleFormSubmit)}
						className="space-y-4"
					>
						{/* Quantity Input */}
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
                       focus:border-green-500 focus:ring-2 focus:ring-green-500/20 h-10"
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
									? "bg-green-500/10 border-green-500/20"
									: "bg-amber-500/10 border-amber-500/20"
							}`}
						>
							<p className="text-xs text-zinc-400 mb-1">
								New stock will be
							</p>
							<p className="text-2xl font-bold text-white">
								{newStock} units
							</p>
							<p
								className={`text-xs mt-2 ${willResolve ? "text-green-400" : "text-amber-400"}`}
							>
								{willResolve
									? "✅ Will be removed from queue"
									: "⚠️ Still below threshold — will remain in queue"}
							</p>
						</div>

						{/* Actions */}
						<div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
							<Button
								type="button"
								variant="ghost"
								onClick={() => onOpenChange(false)}
								disabled={isLoading}
								className="w-full sm:w-auto text-zinc-400 hover:text-white hover:bg-white/10"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={isLoading}
								className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white"
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
			<AlertDialogContent
				className="
      w-[calc(100%-2rem)] sm:max-w-md
      bg-[#13151C] border border-white/10 text-white
      rounded-2xl p-4 sm:p-6
    "
			>
				<AlertDialogHeader>
					<div className="flex items-center gap-3 mb-1">
						<div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30">
							<Trash2 className="w-4 h-4 text-red-400" />
						</div>
						<AlertDialogTitle className="text-white text-lg font-semibold">
							Remove from queue?
						</AlertDialogTitle>
					</div>
					<AlertDialogDescription className="text-zinc-400 text-sm md:pl-11">
						Remove{" "}
						<span className="text-white font-medium">
							{productName}
						</span>{" "}
						from the restock queue? This won&apos;t change stock
						levels.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4">
					<AlertDialogCancel
						disabled={isLoading}
						className="w-full sm:w-auto bg-transparent border-zinc-700 
                   text-zinc-300 hover:bg-white/10 hover:text-white"
					>
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={onConfirm}
						disabled={isLoading}
						className="w-full sm:w-auto bg-red-600 hover:bg-red-500 
                   text-white border-0 disabled:opacity-50 
                   disabled:cursor-not-allowed"
					>
						{isLoading ? "Removing..." : "Remove"}
					</AlertDialogAction>
				</div>
			</AlertDialogContent>
		</AlertDialog>
	);
}
