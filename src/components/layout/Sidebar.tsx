"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
	LayoutDashboard,
	Package,
	Tag,
	ShoppingCart,
	AlertTriangle,
	Activity,
	ChevronLeft,
	ChevronRight,
	LogOut,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/lib/authApi";
import { restockApi } from "@/lib/restockApi";
import { toast } from "sonner";

interface NavItem {
	label: string;
	href: string;
	icon: React.ReactNode;
	badge?: number;
	badgeColor?: string;
}

export function Sidebar() {
	const [collapsed, setCollapsed] = useState(false);
	const pathname = usePathname();
	const { user, clearUser } = useAuthStore();
	const router = useRouter();

	// Fetch restock count
	const { data: restockCount = 0 } = useQuery({
		queryKey: ["restock-count"],
		queryFn: restockApi.getRestockCount,
		refetchInterval: 30000, // Refetch every 30 seconds
	});

	const navItems: NavItem[] = [
		{
			label: "Dashboard",
			href: "/dashboard",
			icon: <LayoutDashboard className="w-5 h-5" />,
		},
		{
			label: "Products",
			href: "/products",
			icon: <Package className="w-5 h-5" />,
		},
		{
			label: "Categories",
			href: "/categories",
			icon: <Tag className="w-5 h-5" />,
		},
		{
			label: "Orders",
			href: "/orders",
			icon: <ShoppingCart className="w-5 h-5" />,
		},
		{
			label: "Restock Queue",
			href: "/restock",
			icon: <AlertTriangle className="w-5 h-5" />,
			badge: restockCount,
			badgeColor: restockCount > 0 ? "bg-red-500" : "bg-zinc-600",
		},
		{
			label: "Activity Log",
			href: "/activity",
			icon: <Activity className="w-5 h-5" />,
		},
	];

	const handleLogout = async () => {
		try {
			await logoutUser();
			clearUser();
			toast.success("Logged out successfully!");
			router.push("/login");
		} catch (error) {
			toast.error("Logout failed");
		}
	};

	const isActive = (href: string) => {
		return pathname === href || pathname.startsWith(href + "/");
	};

	return (
		<>
			{/* Desktop Sidebar */}
			<aside
				className={cn(
					"hidden lg:flex flex-col h-screen bg-[#13161F] border-r border-white/10 transition-all duration-300 fixed left-0 top-0 z-40",
					collapsed ? "w-[64px]" : "w-[240px]",
				)}
			>
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-white/10">
					{!collapsed && (
						<h1 className="text-lg font-bold text-white">
							InventoryOS
						</h1>
					)}
					<button
						onClick={() => setCollapsed(!collapsed)}
						className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
					>
						{collapsed ? (
							<ChevronRight className="w-5 h-5 text-zinc-400" />
						) : (
							<ChevronLeft className="w-5 h-5 text-zinc-400" />
						)}
					</button>
				</div>

				{/* Navigation */}
				<nav className="flex-1 overflow-y-auto py-4 px-2">
					<div className="space-y-1">
						{navItems.map((item) => (
							<div key={item.href} className="relative group">
								<Link href={item.href}>
									<span
										className={cn(
											"flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
											"text-zinc-400 hover:text-white hover:bg-white/5",
											isActive(item.href) &&
												"text-indigo-400 bg-indigo-500/10 border-l-2 border-indigo-500 pl-[10px]",
										)}
									>
										<div className="flex items-center gap-3 flex-1 min-w-0">
											<span className="flex-shrink-0">
												{item.icon}
											</span>
											{!collapsed && (
												<span className="text-sm font-medium truncate">
													{item.label}
												</span>
											)}
										</div>
										{!collapsed && item.badge && (
											<span
												className={cn(
													"text-xs font-semibold px-2 py-0.5 rounded-full text-white",
													item.badgeColor ||
														"bg-indigo-500",
												)}
											>
												{item.badge}
											</span>
										)}
									</span>
								</Link>

								{/* Tooltip on hover (collapsed state) */}
								{collapsed && (
									<div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
										<div className="bg-zinc-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap border border-white/10">
											{item.label}
										</div>
									</div>
								)}
							</div>
						))}
					</div>
				</nav>

				{/* Footer - User Info */}
				<div className="border-t border-white/10 p-3">
					{!collapsed && user ? (
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center flex-shrink-0">
								<span className="text-sm font-bold text-indigo-400">
									{user.name.charAt(0).toUpperCase()}
								</span>
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-white truncate">
									{user.name}
								</p>
								<p className="text-xs text-zinc-400 capitalize truncate">
									{user.role}
								</p>
							</div>
						</div>
					) : collapsed && user ? (
						<div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center flex-shrink-0 mx-auto">
							<span className="text-sm font-bold text-indigo-400">
								{user.name.charAt(0).toUpperCase()}
							</span>
						</div>
					) : null}

					{/* Logout Button */}
					<button
						onClick={handleLogout}
						className={cn(
							"w-full mt-3 px-3 py-2 rounded-lg transition-all duration-200",
							"text-zinc-400 hover:text-red-400 hover:bg-red-500/10",
							"flex items-center justify-center gap-2",
							!collapsed && "text-sm",
						)}
					>
						<LogOut className="w-4 h-4" />
						{!collapsed && <span>Logout</span>}
					</button>
				</div>
			</aside>

			{/* Mobile Sidebar Toggle Button (shown in topbar on mobile) */}
		</>
	);
}
