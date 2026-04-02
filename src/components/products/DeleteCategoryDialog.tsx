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
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Category?</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete{" "}
						<strong>{categoryName}</strong>? This action cannot be
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
