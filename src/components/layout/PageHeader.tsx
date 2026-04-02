import { ReactNode } from "react";

interface PageHeaderProps {
	title: string;
	subtitle?: string;
	action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
	return (
		<div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
			<div className="flex-1">
				<h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
				{subtitle && <p className="text-zinc-400">{subtitle}</p>}
			</div>
			{action && <div className="flex items-center gap-2">{action}</div>}
		</div>
	);
}
