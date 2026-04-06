"use client";

import { useEffect, useState } from "react";
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
	X,
	ShieldCheck,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/lib/authApi";
import { restockApi } from "@/lib/restockApi";
import { toast } from "sonner";
import usePermissions from "@/hooks/usePermissions";

interface NavItem {
	label: string;
	href: string;
	icon: React.ReactNode;
	badge?: number;
	badgeColor?: string;
}

interface SidebarProps {
	isOpen: boolean;
	onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
	const [collapsed, setCollapsed] = useState(false);
	const pathname = usePathname();
	const { user, clearUser } = useAuthStore();
	const router = useRouter();
	const {
		canAccessAdminPanel,
		canAccessOrders,
		canAccessRestock,
		canAccessActivity,
	} = usePermissions();

	useEffect(() => {
		onClose();
	}, [pathname]);

	// Fetch restock count
	const { data: restockCount = 0 } = useQuery({
		queryKey: ["restock-count"],
		queryFn: restockApi.getRestockCount,
		refetchInterval: 30000,
	});

	// Build nav items filtered by role permissions
	const navItems: NavItem[] = [
		{
			label: "Dashboard",
			href: "/dashboard",
			icon: <LayoutDashboard className="w-5 h-5" />,
		},
		{
			label: "Categories",
			href: "/categories",
			icon: <Tag className="w-5 h-5" />,
		},
		{
			label: "Products",
			href: "/products",
			icon: <Package className="w-5 h-5" />,
		},
		// Orders — manager/admin/super_admin only
		...(canAccessOrders
			? [
					{
						label: "Orders",
						href: "/orders",
						icon: <ShoppingCart className="w-5 h-5" />,
					},
				]
			: []),
		// Restock — manager/admin/super_admin only
		...(canAccessRestock
			? [
					{
						label: "Restock Queue",
						href: "/restock",
						icon: <AlertTriangle className="w-5 h-5" />,
						badge: restockCount,
						badgeColor:
							restockCount > 0 ? "bg-red-500" : "bg-zinc-600",
					},
				]
			: []),
		// Activity — manager/admin/super_admin only
		...(canAccessActivity
			? [
					{
						label: "Activity Log",
						href: "/activity",
						icon: <Activity className="w-5 h-5" />,
					},
				]
			: []),
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
			{/* ─── DESKTOP SIDEBAR ─────────────────────────────────────────── */}
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
				<nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2">
					<div className="space-y-1">
						{navItems.map((item) => (
							<div key={item.href} className="relative group">
								<Link href={item.href}>
									<span
										className={cn(
											"flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
											collapsed
												? "justify-center px-2"
												: "justify-start px-3",
											"text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10",
											isActive(item.href) &&
												"text-indigo-400 bg-indigo-500/10 border-l-2 border-indigo-500 pl-[10px]",
										)}
									>
										<span className="flex-shrink-0 w-5 h-5">
											{item.icon}
										</span>
										{!collapsed && (
											<span className="text-sm font-medium truncate">
												{item.label}
											</span>
										)}

										{!collapsed && item.badge ? (
											<span
												className={cn(
													"text-xs font-semibold px-2 py-0.5 rounded-full text-white",
													item.badgeColor ||
														"bg-indigo-500",
												)}
											>
												{item.badge}
											</span>
										) : null}
									</span>
								</Link>

								{/* Tooltip (collapsed) */}
								{collapsed && (
									<div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
										<div className="bg-zinc-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap border border-white/10">
											{item.label}
										</div>
									</div>
								)}
							</div>
						))}

						{/* Admin Panel — amber accent, divider above */}
						{canAccessAdminPanel && (
							<>
								<div className="my-2 mx-1 border-t border-white/10" />

								<div className="relative group">
									<Link href="/admin">
										<span
											className={cn(
												"flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
												collapsed
													? "justify-center px-2"
													: "justify-start px-3",
												"text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10",
												isActive("/admin") &&
													"text-amber-400 bg-amber-500/10 border-l-2 border-amber-500 pl-[10px]",
											)}
										>
											<span className="flex-shrink-0 w-5 h-5">
												<ShieldCheck className="w-5 h-5" />
											</span>
											{!collapsed && (
												<span className="text-sm font-medium">
													Admin Panel
												</span>
											)}
										</span>
									</Link>

									{collapsed && (
										<div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
											<div className="bg-zinc-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap border border-white/10">
												Admin Panel
											</div>
										</div>
									)}
								</div>
							</>
						)}
					</div>
				</nav>

				{/* Footer — User Info + Logout */}
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
									{user.role.replace("_", " ")}
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

			{/* ─── MOBILE SIDEBAR ──────────────────────────────────────────── */}
			<div
				className={cn(
					"fixed inset-0 z-50 lg:hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
					isOpen
						? "opacity-100 pointer-events-auto"
						: "opacity-0 pointer-events-none",
				)}
			>
				{/* Backdrop */}
				<div
					className={cn(
						"absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
						isOpen ? "opacity-100" : "opacity-0",
					)}
					onClick={onClose}
				/>

				{/* Drawer */}
				<aside
					onClick={(e) => e.stopPropagation()}
					className={cn(
						"absolute left-0 top-0 h-full w-[270px] bg-[#0e1117] border-r border-white/10 transform transition-transform duration-300 ease-in-out flex flex-col",
						isOpen ? "translate-x-0" : "-translate-x-full",
					)}
				>
					{/* Header */}
					<div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
						<div className="flex items-center gap-2.5">
							<div className="w-8 h-8 bg-indigo-500/20 border border-indigo-500/40 rounded-lg flex items-center justify-center">
								<span className="text-indigo-400 text-sm font-bold">
									I
								</span>
							</div>
							<div>
								<h1 className="text-white font-bold text-sm leading-none">
									InventoryOS
								</h1>
								<p className="text-zinc-500 text-xs mt-0.5">
									Smart Inventory
								</p>
							</div>
						</div>
						<button
							onClick={onClose}
							className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
						>
							<X className="w-4 h-4" />
						</button>
					</div>

					{/* Nav */}
					<nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
						{navItems.map((item) => {
							const active = pathname === item.href;
							return (
								<Link key={item.href} href={item.href}>
									<span
										onClick={onClose}
										className={cn(
											"flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
											active
												? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
												: "text-zinc-400 hover:text-white hover:bg-white/5",
										)}
									>
										<span
											className={cn(
												"w-4 h-4 flex-shrink-0",
												active
													? "text-indigo-400"
													: "text-zinc-500",
											)}
										>
											{item.icon}
										</span>
										{item.label}
										{item.badge && item.badge > 0 && (
											<span className="ml-auto bg-red-500/20 text-red-400 border border-red-500/30 text-xs px-1.5 py-0.5 rounded-full">
												{item.badge}
											</span>
										)}
									</span>
								</Link>
							);
						})}

						{/* Admin Panel */}
						{canAccessAdminPanel && (
							<>
								<div className="my-2 mx-1 border-t border-white/10" />

								<Link href="/admin">
									<span
										onClick={onClose}
										className={cn(
											"flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
											isActive("/admin")
												? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
												: "text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10",
										)}
									>
										<ShieldCheck
											className={cn(
												"w-4 h-4 flex-shrink-0",
												isActive("/admin")
													? "text-amber-400"
													: "text-zinc-500",
											)}
										/>
										Admin Panel
									</span>
								</Link>
							</>
						)}
					</nav>

					{/* Footer */}
					<div className="px-4 py-4 border-t border-white/10 space-y-2">
						<div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/5">
							<div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center flex-shrink-0">
								<span className="text-xs font-bold text-indigo-400">
									{user?.name?.charAt(0).toUpperCase()}
								</span>
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-white truncate">
									{user?.name}
								</p>
								<p className="text-xs text-zinc-400 capitalize">
									{user?.role?.replace("_", " ")}
								</p>
							</div>
						</div>

						<button
							onClick={() => {
								onClose();
								handleLogout();
							}}
							className="w-full flex justify-center items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 border border-indigo-500/40 hover:border-red-500/20 transition-all duration-150 text-sm font-medium"
						>
							<LogOut className="w-4 h-4 flex-shrink-0" />
							Logout
						</button>
					</div>
				</aside>
			</div>
		</>
	);
}
