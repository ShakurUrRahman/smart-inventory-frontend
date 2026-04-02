import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

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
			if (!buttonRef.current?.contains(e.target as Node)) {
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
					<div
						style={{ top: position.top, left: position.left }}
						className="fixed w-40 bg-[#1C1F2A] border border-zinc-700/60 rounded-lg shadow-lg z-[9999]"
					>
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
					</div>,
					document.body,
				)}
		</>
	);
}
