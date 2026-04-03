"use client";

import { Bell, LogOut, User, Menu, X, Check } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/lib/authApi";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/dashboardApi";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const ACTIVITY_ICONS: Record<string, string> = {
	Order: "📦",
	Product: "🏷️",
	Stock: "📊",
	User: "👤",
	Category: "📁",
};

interface TopbarProps {
	title: string;
	onMenuClick?: () => void;
}

export function Topbar({ title, onMenuClick }: TopbarProps) {
	const { user, clearUser } = useAuthStore();
	const {
		notifications,
		unreadCount,
		markAsRead,
		markAllAsRead,
		removeNotification,
		setActivities,
	} = useNotificationStore();
	const router = useRouter();
	const [userMenuOpen, setUserMenuOpen] = useState(false);
	const [notificationOpen, setNotificationOpen] = useState(false);

	// Fetch recent activities
	const { data: activities = [] } = useQuery({
		queryKey: ["dashboard-activity"],
		queryFn: dashboardApi.getRecentActivity,
		staleTime: 30000,
		gcTime: 60000,
		refetchInterval: 30000,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	// Initialize notifications from activities
	useEffect(() => {
		setActivities(activities);
	}, [activities, setActivities]);

	const handleLogout = async () => {
		try {
			setUserMenuOpen(false);
			await logoutUser();
			clearUser();
			toast.success("Logged out successfully!");
			router.push("/login");
		} catch (error) {
			toast.error("Logout failed");
		}
	};

	const handleNotificationClick = (id: string) => {
		markAsRead(id);
	};

	const handleRemoveNotification = (id: string) => {
		removeNotification(id);
	};

	return (
		<div className="h-16 bg-[#13161F] border-b border-white/10 flex items-center justify-between px-6 sticky top-0 z-30">
			{/* Left: Title + Mobile Menu Button */}
			<div className="flex items-center gap-4">
				<button
					onClick={onMenuClick}
					className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
				>
					<Menu className="w-5 h-5 text-zinc-400" />
				</button>
				<h2 className="text-xl font-semibold text-white">{title}</h2>
			</div>

			{/* Right: Notifications + User Menu */}
			<div className="flex items-center gap-4">
				{/* Notification Bell */}
				<div className="relative">
					<button
						onClick={() => setNotificationOpen(!notificationOpen)}
						className="p-2 hover:bg-white/10 rounded-lg transition-colors relative"
					>
						<Bell className="w-5 h-5 text-zinc-400 hover:text-white" />
						{unreadCount > 0 && (
							<span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
						)}
					</button>

					{/* Notification Dropdown */}
					{notificationOpen && (
						<div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-16 sm:top-full sm:mt-2 w-auto sm:w-80 bg-[#1a1d28] border border-white/10 rounded-lg shadow-lg z-50 max-h-[80vh] sm:max-h-96 overflow-hidden flex flex-col">
							{/* Header */}
							<div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
								<h3 className="text-sm font-semibold text-white">
									Notifications
								</h3>
								{unreadCount > 0 && (
									<button
										onClick={markAllAsRead}
										className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
									>
										<Check className="w-3 h-3" />
										Mark all
									</button>
								)}
							</div>

							{/* Notifications List */}
							{notifications.length > 0 ? (
								<div className="overflow-y-auto flex-1">
									{notifications.map((notification) => (
										<div
											key={notification.id}
											className={`px-4 py-3 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors ${
												!notification.isRead
													? "bg-indigo-500/10"
													: ""
											}`}
										>
											<div className="flex items-start gap-3">
												<span className="text-lg flex-shrink-0">
													{ACTIVITY_ICONS[
														notification.entityType
													] || "📝"}
												</span>
												<div className="flex-1 min-w-0">
													<p className="text-sm text-white truncate">
														{
															notification.description
														}
													</p>
													<p className="text-xs text-zinc-400 mt-1">
														{formatDistanceToNow(
															new Date(
																notification.createdAt,
															),
															{
																addSuffix: true,
															},
														)}
													</p>
												</div>
												<button
													onClick={() =>
														handleNotificationClick(
															notification.id,
														)
													}
													className={`p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0 ${
														notification.isRead
															? "text-green-400"
															: "text-zinc-400"
													}`}
												>
													<Check className="w-4 h-4" />
												</button>
												<button
													onClick={() =>
														handleRemoveNotification(
															notification.id,
														)
													}
													className="p-1 hover:bg-red-500/10 rounded text-zinc-400 hover:text-red-400 transition-colors flex-shrink-0"
												>
													<X className="w-4 h-4" />
												</button>
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="px-4 py-8 text-center text-zinc-400 text-sm">
									No notifications yet
								</div>
							)}

							{/* Footer */}
							{notifications.length > 0 && (
								<div className="px-4 py-2 border-t border-white/10 bg-white/5">
									<a
										href="/activity"
										className="text-xs text-indigo-400 hover:text-indigo-300 inline-block"
									>
										View all activity →
									</a>
								</div>
							)}
						</div>
					)}

					{/* Backdrop to close notification */}
					{notificationOpen && (
						<div
							className="fixed inset-0 z-40"
							onClick={() => setNotificationOpen(false)}
						/>
					)}
				</div>

				{/* User Dropdown */}
				<div className="relative">
					<button
						onClick={() => setUserMenuOpen(!userMenuOpen)}
						className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors"
					>
						<div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center">
							<span className="text-xs font-bold text-indigo-400">
								{user?.name.charAt(0).toUpperCase()}
							</span>
						</div>
						<div className="hidden sm:flex flex-col items-start">
							<p className="text-sm font-medium text-white">
								{user?.name}
							</p>
							<p className="text-xs text-zinc-400 capitalize">
								{user?.role}
							</p>
						</div>
					</button>

					{/* Dropdown Menu */}
					{userMenuOpen && (
						<div
							className="absolute right-0 top-full mt-2 w-48 bg-[#1a1d28] border border-white/10 rounded-lg shadow-lg z-50"
							onClick={() => setUserMenuOpen(false)}
						>
							{/* User Info */}
							<div className="px-4 py-3 border-b border-white/10">
								<p className="text-sm font-medium text-white">
									{user?.name}
								</p>
								<p className="text-xs text-zinc-400 capitalize">
									{user?.role}
								</p>
							</div>

							{/* Menu Items */}
							<div className="py-1">
								<button
									disabled
									className="w-full px-4 py-2 text-sm text-zinc-400 hover:bg-white/5 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<User className="w-4 h-4" />
									My Profile
								</button>
							</div>

							{/* Divider */}
							<div className="border-t border-white/10" />

							{/* Logout */}
							<div className="py-1">
								<button
									onClick={handleLogout}
									className="w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
								>
									<LogOut className="w-4 h-4" />
									Logout
								</button>
							</div>
						</div>
					)}

					{/* Backdrop to close menu */}
					{userMenuOpen && (
						<div
							className="fixed inset-0 z-40"
							onClick={() => setUserMenuOpen(false)}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
