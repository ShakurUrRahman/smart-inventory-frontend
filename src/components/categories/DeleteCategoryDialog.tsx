"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

interface DeleteCategoryDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => Promise<void>;
	categoryName: string;
	isLoading?: boolean;
}

export function DeleteCategoryDialog({
	open,
	onOpenChange,
	onConfirm,
	categoryName,
	isLoading = false,
}: DeleteCategoryDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent className="bg-[#13161F] border border-white/10 rounded-2xl w-[calc(100%-2rem)] sm:max-w-md mx-auto p-5 sm:p-6">
				<AlertDialogHeader>
					{/* Icon */}
					<div className="flex justify-center mb-3">
						<div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
							<Trash2 className="w-5 h-5 text-red-400" />
						</div>
					</div>

					<AlertDialogTitle className="text-white text-center text-lg font-semibold">
						Delete Category?
					</AlertDialogTitle>
					<AlertDialogDescription className="text-zinc-400 text-center text-sm mt-1.5">
						Are you sure you want to delete{" "}
						<span className="text-white font-medium">
							{categoryName}
						</span>
						? This action cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-5">
					<AlertDialogCancel
						disabled={isLoading}
						className="w-full sm:w-auto bg-transparent border border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white  h-10"
					>
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={onConfirm}
						disabled={isLoading}
						className="w-full sm:w-auto bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30  h-10 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isLoading ? "Deleting..." : "Delete"}
					</AlertDialogAction>
				</div>
			</AlertDialogContent>
		</AlertDialog>
	);
}
