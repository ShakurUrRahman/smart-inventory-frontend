"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Order } from "@/lib/ordersApi";

const VALID_TRANSITIONS: Record<string, string[]> = {
	Pending: ["Confirmed", "Cancelled"],
	Confirmed: ["Shipped", "Cancelled"],
	Shipped: ["Delivered"],
	Delivered: [],
	Cancelled: [],
};

interface StatusDropdownProps {
	order: Order;
	onStatusChange: (newStatus: string) => void;
}

export function StatusDropdown({ order, onStatusChange }: StatusDropdownProps) {
	const [isOpen, setIsOpen] = useState(false);
	const validNextStatuses = VALID_TRANSITIONS[order.status] || [];

	if (validNextStatuses.length === 0) {
		return (
			<button disabled className="p-1.5 text-zinc-600 cursor-not-allowed">
				<ChevronDown className="w-4 h-4" />
			</button>
		);
	}

	return (
		<div className="relative">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="p-1.5 rounded hover:bg-indigo-500/20 text-indigo-400 transition"
			>
				<ChevronDown className="w-4 h-4" />
			</button>

			{isOpen && (
				<div className="absolute right-0 mt-1 w-40 bg-[#1C1F2A] border border-zinc-700/60 rounded-lg shadow-lg z-20">
					{validNextStatuses.map((status) => (
						<button
							key={status}
							onClick={() => {
								onStatusChange(status);
								setIsOpen(false);
							}}
							className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 first:rounded-t-lg last:rounded-b-lg transition"
						>
							{status}
						</button>
					))}
				</div>
			)}
		</div>
	);
}

interface StatusConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	orderNumber: string;
	newStatus: string;
	onConfirm: () => Promise<void>;
	isLoading?: boolean;
}

export function StatusConfirmDialog({
	open,
	onOpenChange,
	orderNumber,
	newStatus,
	onConfirm,
	isLoading = false,
}: StatusConfirmDialogProps) {
	const handleConfirm = async () => {
		await onConfirm();
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Update Order Status?</AlertDialogTitle>
					<AlertDialogDescription>
						Mark order <strong>{orderNumber}</strong> as{" "}
						<strong>{newStatus}</strong>?
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="flex justify-end gap-2">
					<AlertDialogCancel disabled={isLoading}>
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleConfirm}
						disabled={isLoading}
						className={
							isLoading ? "opacity-50 cursor-not-allowed" : ""
						}
					>
						{isLoading ? "Updating..." : "Confirm"}
					</AlertDialogAction>
				</div>
			</AlertDialogContent>
		</AlertDialog>
	);
}
