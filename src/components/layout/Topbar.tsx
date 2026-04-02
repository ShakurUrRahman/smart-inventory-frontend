"use client";

import { Bell, LogOut, User, Menu } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/lib/authApi";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface TopbarProps {
	title: string;
	onMenuClick?: () => void;
}

export function Topbar({ title, onMenuClick }: TopbarProps) {
	const { user, clearUser } = useAuthStore();
	const router = useRouter();
	const [userMenuOpen, setUserMenuOpen] = useState(false);

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
				<button className="p-2 hover:bg-white/10 rounded-lg transition-colors relative group">
					<Bell className="w-5 h-5 text-zinc-400 hover:text-white" />
					<span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
					<div className="absolute right-0 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
						<div className="bg-zinc-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap border border-white/10">
							Notifications
						</div>
					</div>
				</button>

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
