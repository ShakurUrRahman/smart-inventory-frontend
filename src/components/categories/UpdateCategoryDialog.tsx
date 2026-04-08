"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Pencil } from "lucide-react";
import {
	Modal,
	ModalHeader,
	ModalBody,
	ModalFooter,
} from "@/components/shared/DialogModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Category } from "@/lib/categoriesApi";

const updateCategorySchema = z.object({
	name: z
		.string()
		.min(2, "Name must be at least 2 characters")
		.max(50, "Name cannot exceed 50 characters"),
});

type UpdateCategoryFormData = z.infer<typeof updateCategorySchema>;

interface UpdateCategoryDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (data: { name: string }) => Promise<void>;
	isLoading: boolean;
	category: Category | null;
}

export function UpdateCategoryDialog({
	open,
	onOpenChange,
	onSubmit,
	isLoading,
	category,
}: UpdateCategoryDialogProps) {
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<UpdateCategoryFormData>({
		resolver: zodResolver(updateCategorySchema),
	});

	useEffect(() => {
		if (category) {
			reset({ name: category.name });
		}
	}, [category, reset]);

	const handleFormSubmit = async (data: UpdateCategoryFormData) => {
		await onSubmit(data);
	};

	return (
		<Modal open={open} onOpenChange={onOpenChange}>
			<ModalHeader>
				<div className="flex items-center gap-3 mb-1">
					<div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex-shrink-0">
						<Pencil className="w-4 h-4 text-indigo-400" />
					</div>
					<h2 className="text-white text-base sm:text-lg font-semibold">
						Rename Category
					</h2>
				</div>
				<p className="text-zinc-400 text-sm pl-11">
					Update the name for{" "}
					<span className="text-white font-medium">
						{category?.name}
					</span>
				</p>
			</ModalHeader>

			<form onSubmit={handleSubmit(handleFormSubmit)}>
				<ModalBody>
					<div className="space-y-1.5">
						<Label
							htmlFor="update-name"
							className="text-zinc-300 text-sm font-medium"
						>
							Category Name
						</Label>
						<Input
							id="update-name"
							autoFocus
							placeholder="e.g. Electronics"
							className="bg-[#1C1F2A] border-zinc-700/60 text-white placeholder:text-zinc-600
                         focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
                         h-10 transition-colors"
							{...register("name")}
						/>
						{errors.name && (
							<p className="text-red-400 text-xs mt-1">
								{errors.name.message}
							</p>
						)}
					</div>
				</ModalBody>

				<ModalFooter>
					<Button
						type="button"
						variant="ghost"
						onClick={() => onOpenChange(false)}
						disabled={isLoading}
						className="w-full sm:w-auto border border-white/30 text-zinc-400 hover:text-white hover:bg-white/10"
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
								Saving...
							</>
						) : (
							"Save Changes"
						)}
					</Button>
				</ModalFooter>
			</form>
		</Modal>
	);
}
