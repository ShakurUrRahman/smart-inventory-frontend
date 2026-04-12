"use client";

import { useCallback, useState } from "react";

// Components
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Toaster } from "sonner";

// Utils
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
	const [isCollapsed, setIsCollapsed] = useState(false);

	const handleSidebarClose = useCallback(() => setSidebarOpen(false), []);

	return (
		<div className="flex h-screen bg-[#0F1117] overflow-hidden">
			{/* Sidebar - Fixed/Absolute on the left.
          Using 'onCollapsed' to match the Sidebar's internal prop expectations.
      */}
			<Sidebar
				isOpen={sidebarOpen}
				onCollapsed={isCollapsed}
				onClose={handleSidebarClose}
				setOnCollapsed={setIsCollapsed}
			/>

			{/* Main Content Area 
          The margin-left (ml) shifts dynamically based on the sidebar's width.
      */}
			<main
				className={cn(
					"flex-1 flex flex-col h-full min-w-0 transition-all duration-300",
					isCollapsed ? "lg:ml-[64px]" : "lg:ml-[240px]",
				)}
			>
				<Topbar
					title={pageTitle}
					isOpen={sidebarOpen}
					onMenuClick={() => {
						console.log("Menu clicked, current:", sidebarOpen);
						setSidebarOpen(true);
					}}
				/>

				{/* Scrollable Content Container */}
				<div className="flex-1 overflow-y-auto">
					<div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
						{children}
					</div>
				</div>
			</main>

			{/* Global Notifications */}
			<Toaster position="top-right" theme="dark" richColors closeButton />
		</div>
	);
}
