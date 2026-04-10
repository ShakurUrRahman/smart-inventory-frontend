import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				ref={ref}
				type={type}
				data-slot="input"
				className={cn(
					// Layout & Sizing
					"h-8 w-full min-w-0 rounded-lg px-2.5 py-1 text-base md:text-sm",
					// Borders & Background
					"border border-input bg-transparent dark:bg-input/30",
					// Typography & Placeholder
					"text-foreground placeholder:text-muted-foreground outline-none",
					// Transitions & States
					"transition-colors",
					"focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
					// Disabled States
					"disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-input/50 dark:disabled:bg-input/80",
					// Validation (Aria-Invalid)
					"aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
					// File Input Styling
					"file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
					className,
				)}
				{...props}
			/>
		);
	},
);

Input.displayName = "Input";

export { Input };
