"use client";

import { useState, useEffect, useRef } from "react";
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
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

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
	const [position, setPosition] = useState({ top: 0, left: 0 });
	const buttonRef = useRef<HTMLButtonElement>(null);
	const validNextStatuses = VALID_TRANSITIONS[order.status] || [];

	useEffect(() => {
		if (isOpen && buttonRef.current) {
			const rect = buttonRef.current.getBoundingClientRect();
			setPosition({
				top: rect.bottom + window.scrollY + 4,
				left: rect.right + window.scrollX - 160, // 160 = w-40
			});
		}
	}, [isOpen]);

	// Close on outside click
	useEffect(() => {
		if (!isOpen) return;
		const handle = (e: MouseEvent) => {
			const portal = document.querySelector("[data-status-dropdown]");
			if (
				!buttonRef.current?.contains(e.target as Node) &&
				!portal?.contains(e.target as Node)
			) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handle);
		return () => document.removeEventListener("mousedown", handle);
	}, [isOpen]);

	if (validNextStatuses.length === 0) {
		return (
			<button disabled className="p-1.5 text-zinc-600 cursor-not-allowed">
				<ChevronDown className="w-4 h-4" />
			</button>
		);
	}

	return (
		<>
			<button
				ref={buttonRef}
				onClick={() => setIsOpen(!isOpen)}
				className="p-1.5 rounded hover:bg-indigo-500/20 text-indigo-400 transition"
			>
				<ChevronDown className="w-4 h-4" />
			</button>

			{isOpen &&
				createPortal(
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: -6 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: -6 }}
						transition={{ duration: 0.15, ease: "easeOut" }}
						style={{ top: position.top, left: position.left }}
						className="fixed w-40 bg-[#1C1F2A] border border-zinc-700/60 rounded-lg shadow-lg z-[9999]"
					>
						{validNextStatuses.map((status) => (
							<button
								key={status}
								onMouseDown={(e) => {
									e.stopPropagation();
									onStatusChange(status);
									setIsOpen(false);
								}}
								className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 first:rounded-t-lg last:rounded-b-lg transition"
							>
								{status}
							</button>
						))}
					</motion.div>,
					document.body,
				)}
		</>
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
			<AlertDialogContent className="w-[calc(100%-2rem)] sm:max-w-md rounded-xl mx-auto">
				<AlertDialogHeader>
					<AlertDialogTitle className="text-base sm:text-lg">
						Update Order Status?
					</AlertDialogTitle>
					<AlertDialogDescription className="text-sm">
						Mark order{" "}
						<strong className="text-white">{orderNumber}</strong> as{" "}
						<strong className="text-white">{newStatus}</strong>?
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-2">
					<AlertDialogCancel
						disabled={isLoading}
						className="w-full sm:w-auto"
					>
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleConfirm}
						disabled={isLoading}
						className={`w-full sm:w-auto ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
					>
						{isLoading ? "Updating..." : "Confirm"}
					</AlertDialogAction>
				</div>
			</AlertDialogContent>
		</AlertDialog>
	);
}
