"use client";

import { Trash2 } from "lucide-react";
import {
	Modal,
	ModalBody,
	ModalFooter,
	ModalHeader,
} from "../shared/DialogModal";
import { Button } from "@/components/ui/button";

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
		<Modal open={open} onOpenChange={onOpenChange}>
			<ModalHeader>
				{/* Icon */}
				<div className="flex justify-center mb-3">
					<div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
						<Trash2 className="w-5 h-5 text-red-400" />
					</div>
				</div>

				<div className="text-white text-center text-lg font-semibold">
					Delete Category?
				</div>
			</ModalHeader>
			<ModalBody>
				<div className="text-zinc-400 text-center text-sm mt-1.5">
					Are you sure you want to delete{" "}
					<span className="text-white font-medium">
						{categoryName}
					</span>
					? This action cannot be undone.
				</div>
			</ModalBody>
			<ModalFooter>
				<Button
					disabled={isLoading}
					onClick={() => onOpenChange(false)}
					className="w-full sm:w-auto bg-slate-600/70 hover:bg-slate-600"
				>
					Cancel
				</Button>
				<Button
					onClick={onConfirm}
					disabled={isLoading}
					className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white"
				>
					{isLoading ? "Deleting..." : "Delete"}
				</Button>
			</ModalFooter>
		</Modal>
	);
}
