"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
	children: React.ReactNode;
	pageTitle?: string;
}

export function DashboardLayout({
	children,
	pageTitle = "Dashboard",
}: DashboardLayoutProps) {
	const [sidebarOpen, setSidebarOpen] = useState(false);

	return (
		<div className="flex h-screen bg-[#0F1117]">
			{/* Sidebar */}
			<Sidebar
				isOpen={sidebarOpen}
				onClose={() => setSidebarOpen(false)}
			/>

			{/* Mobile Sidebar Overlay */}
			{/* {sidebarOpen && (
				<div
					className="fixed inset-0 bg-black/50 z-30 lg:hidden"
					onClick={() => setSidebarOpen(false)}
				/>
			)} */}

			{/* Main Content */}
			<main className="flex-1 flex flex-col lg:ml-[240px] overflow-hidden">
				{/* Topbar */}
				<Topbar
					title={pageTitle}
					onMenuClick={() => setSidebarOpen(!sidebarOpen)}
				/>

				{/* Page Content */}
				<div className="flex-1 overflow-y-auto">
					<div className="p-6 max-w-7xl mx-auto w-full">
						{children}
					</div>
				</div>
			</main>

			{/* Toast Notifications */}
			<Toaster position="top-right" theme="dark" />
		</div>
	);
}
