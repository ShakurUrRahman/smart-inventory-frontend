// src/components/ui/Drawer.tsx
"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type DrawerSide = "right" | "left" | "bottom";

interface DrawerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	children: React.ReactNode;
	side?: DrawerSide;
	className?: string;
}

export function Drawer({
	open,
	onOpenChange,
	children,
	side = "right",
	className = "",
}: DrawerProps) {
	const drawerRef = useRef<HTMLDivElement>(null);

	// Escape key
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onOpenChange(false);
		};
		if (open) document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [open, onOpenChange]);

	// Prevent body scroll
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

	const slideVariants = {
		right: {
			initial: { x: "100%" },
			animate: { x: 0 },
			exit: { x: "100%" },
		},
		left: {
			initial: { x: "-100%" },
			animate: { x: 0 },
			exit: { x: "-100%" },
		},
		bottom: {
			initial: { y: "100%" },
			animate: { y: 0 },
			exit: { y: "100%" },
		},
	};

	const positionClass = {
		right: "inset-y-0 right-0 h-full w-full sm:max-w-xl",
		left: "inset-y-0 left-0 h-full w-full sm:max-w-xl",
		bottom: "inset-x-0 bottom-0 w-full max-h-[90vh] rounded-t-2xl",
	}[side];

	return (
		<AnimatePresence>
			{open && (
				<div className="fixed inset-0 z-50 flex">
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.25 }}
						onClick={() => onOpenChange(false)}
						className="absolute inset-0 bg-black/60 backdrop-blur-sm"
					/>

					{/* Drawer Panel */}
					<motion.div
						ref={drawerRef}
						initial={slideVariants[side].initial}
						animate={slideVariants[side].animate}
						exit={slideVariants[side].exit}
						transition={{
							type: "spring",
							stiffness: 350,
							damping: 40,
						}}
						className={`absolute ${positionClass} bg-[#0a0d12] border-l border-white/10 shadow-2xl flex flex-col overflow-hidden ${className}`}
					>
						{children}
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}

export function DrawerHeader({
	children,
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={`px-6 py-5 border-b border-white/10 flex-shrink-0 ${className}`}
		>
			{children}
		</div>
	);
}

export function DrawerBody({
	children,
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={`flex-1 overflow-y-auto px-6 py-5 ${className}`}>
			{children}
		</div>
	);
}

export function DrawerFooter({
	children,
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={`px-6 py-4 border-t border-white/10 flex-shrink-0 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end ${className}`}
		>
			{children}
		</div>
	);
}

export function DrawerClose({ onClose }: { onClose: () => void }) {
	return (
		<button
			onClick={onClose}
			className="absolute right-4 top-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors z-10"
		>
			<X className="w-4 h-4" />
		</button>
	);
}
