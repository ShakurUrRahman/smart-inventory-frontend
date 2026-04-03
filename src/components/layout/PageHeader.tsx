import { ReactNode } from "react";

interface PageHeaderProps {
	title: string;
	subtitle?: string;
	action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
	return (
		<div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
			<div className="flex-1 min-w-0">
				<h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2 truncate">
					{title}
				</h1>
				{subtitle && (
					<p className="text-sm sm:text-base text-zinc-400 truncate">
						{subtitle}
					</p>
				)}
			</div>
			{action && (
				<div className="flex items-center gap-2 flex-shrink-0">
					{action}
				</div>
			)}
		</div>
	);
}
