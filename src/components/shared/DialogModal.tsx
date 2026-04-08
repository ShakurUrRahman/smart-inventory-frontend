// src/components/ui/Modal.tsx
"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	children: React.ReactNode;
	className?: string;
}

export function Modal({ open, onOpenChange, children, className }: ModalProps) {
	const overlayRef = useRef<HTMLDivElement>(null);

	// Close on Escape key
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onOpenChange(false);
		};
		if (open) document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [open, onOpenChange]);

	// Prevent body scroll when open
	useEffect(() => {
		if (open) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [open]);

	const handleOverlayClick = (e: React.MouseEvent) => {
		if (e.target === overlayRef.current) onOpenChange(false);
	};

	return (
		<AnimatePresence>
			{open && (
				<div className="fixed inset-0 z-50 flex items-center justify-center px-4">
					{/* Backdrop */}
					<motion.div
						ref={overlayRef}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						onClick={handleOverlayClick}
						className="absolute inset-0 bg-black/70 backdrop-blur-sm"
					/>

					{/* Modal Content */}
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 8 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 8 }}
						transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
						className={`relative z-10 w-full max-w-md bg-[#13151C] rounded-xl shadow-2xl ${className || ""}`}
					>
						{/* Close Button */}
						<button
							onClick={() => onOpenChange(false)}
							className="absolute right-4 top-4 p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
						>
							<X className="w-4 h-4" />
						</button>

						{children}
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}

// Sub-components for convenience
export function ModalHeader({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={`px-6 pt-6 pb-2 ${className || ""}`}>{children}</div>
	);
}

export function ModalBody({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return <div className={`px-6 py-4 ${className || ""}`}>{children}</div>;
}

export function ModalFooter({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={`px-6 pb-6 pt-2 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end ${className || ""}`}
		>
			{children}
		</div>
	);
}
