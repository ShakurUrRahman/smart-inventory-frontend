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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const addCategorySchema = z.object({
	name: z
		.string()
		.min(2, "Category name must be at least 2 characters")
		.max(50, "Category name cannot exceed 50 characters"),
});

type AddCategoryFormData = z.infer<typeof addCategorySchema>;

interface AddCategoryDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (data: AddCategoryFormData) => Promise<void>;
	isLoading?: boolean;
}

export function AddCategoryDialog({
	open,
	onOpenChange,
	onSubmit,
	isLoading = false,
}: AddCategoryDialogProps) {
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<AddCategoryFormData>({
		resolver: zodResolver(addCategorySchema),
	});

	const handleFormSubmit = async (data: AddCategoryFormData) => {
		await onSubmit(data);
		reset();
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Add Category</DialogTitle>
					<DialogDescription>
						Create a new category for organizing your products.
					</DialogDescription>
				</DialogHeader>

				<form
					onSubmit={handleSubmit(handleFormSubmit)}
					className="space-y-4"
				>
					<div className="space-y-1.5">
						<Label htmlFor="name" className="text-zinc-300">
							Category Name
						</Label>
						<Input
							id="name"
							placeholder="e.g., Electronics, Clothing"
							className="bg-[#1C1F2A] border-zinc-700/60"
							disabled={isLoading}
							{...register("name")}
						/>
						{errors.name && (
							<p className="text-red-400 text-xs mt-1">
								{errors.name.message}
							</p>
						)}
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
							className="bg-indigo-600 hover:bg-indigo-500"
							disabled={isLoading}
						>
							{isLoading ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									Creating...
								</>
							) : (
								"Create Category"
							)}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
