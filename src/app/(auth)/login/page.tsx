"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { loginUser } from "@/lib/authApi";
import { toast } from "sonner";

const loginSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
	password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const DEMO_ACCOUNTS = [
	{
		role: "super_admin",
		label: "Super Admin",
		description: "Full Access",
		icon: "👑",
		email: "superadmin@inventory.com",
		password: "superadmin123",
		border: "border-yellow-500/40 hover:border-yellow-400",
		bg: "hover:bg-yellow-500/5",
		iconBg: "bg-yellow-500/20 border-yellow-500/30",
		iconColor: "text-yellow-400",
	},
	{
		role: "admin",
		label: "Admin",
		description: "User Mgmt",
		icon: "🛡️",
		email: "admin@inventory.com",
		password: "admin123",
		border: "border-indigo-500/40 hover:border-indigo-400",
		bg: "hover:bg-indigo-500/5",
		iconBg: "bg-indigo-500/20 border-indigo-500/30",
		iconColor: "text-indigo-400",
	},
	{
		role: "manager",
		label: "Manager",
		description: "Ltd. Access",
		icon: "💼",
		email: "manager@inventory.com",
		password: "manager123",
		border: "border-blue-500/40 hover:border-blue-400",
		bg: "hover:bg-blue-500/5",
		iconBg: "bg-blue-500/20 border-blue-500/30",
		iconColor: "text-blue-400",
	},
	{
		role: "user",
		label: "User",
		description: "Basic Access",
		icon: "👤",
		email: "user@inventory.com",
		password: "user123",
		border: "border-zinc-500/40 hover:border-zinc-400",
		bg: "hover:bg-zinc-500/5",
		iconBg: "bg-zinc-500/20 border-zinc-500/30",
		iconColor: "text-zinc-400",
	},
];

export default function LoginPage() {
	const router = useRouter();
	const { setUser, isHydrated, user, setToken, setIsHydrated } =
		useAuthStore();
	const [serverError, setServerError] = useState<string | null>(null);
	const [loadingRole, setLoadingRole] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors, isSubmitting },
	} = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

	useEffect(() => {
		if (isHydrated && user) {
			router.replace("/dashboard");
		}
	}, [user, isHydrated, router]);

	const onSubmit = async (data: LoginFormData) => {
		try {
			setServerError(null);
			const res = await loginUser(data.email, data.password);
			setUser(res.user);
			setToken(res.token);
			setIsHydrated(true);
			toast.success("Signed in successfully!");
			router.push("/dashboard");
		} catch (err: any) {
			const errorMsg =
				err.message || "Invalid credentials. Please try again.";
			setServerError(errorMsg);
			toast.error(errorMsg);
		} finally {
			setLoadingRole(null);
		}
	};

	const handleDemoLogin = async (account: (typeof DEMO_ACCOUNTS)[0]) => {
		setLoadingRole(account.role);
		setValue("email", account.email);
		setValue("password", account.password);
		await handleSubmit(onSubmit)();
	};

	return (
		<div className="w-full max-w-5xl flex rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-white/5">
			{/* ── LEFT PANEL ── */}
			<div className="hidden sm:flex flex-col justify-between w-[45%] bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 p-10 relative overflow-hidden">
				<div
					className="absolute inset-0 opacity-[0.12]"
					style={{
						backgroundImage: `radial-gradient(circle at 1px 1px, white 1.5px, transparent 0)`,
						backgroundSize: "36px 36px",
					}}
				/>
				<div className="absolute -bottom-20 -right-20 w-72 h-72 bg-violet-400/30 rounded-full blur-3xl" />
				<div className="absolute -top-10 -left-10 w-48 h-48 bg-indigo-300/20 rounded-full blur-2xl" />

				<div className="relative z-10">
					<div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-5 border border-white/30">
						<Package className="text-white w-6 h-6" />
					</div>
					<h1 className="text-white text-3xl font-bold tracking-tight">
						InventoryOS
					</h1>
					<p className="text-indigo-200/80 text-sm mt-1 font-medium tracking-wide uppercase">
						Smart Inventory Platform
					</p>
				</div>

				<div className="relative z-10 space-y-6">
					<div>
						<p className="text-white text-xl font-semibold leading-snug">
							Smart stock.
							<br />
							Smarter decisions.
						</p>
						<p className="text-indigo-100/70 text-sm mt-3 leading-relaxed">
							Track inventory, manage orders, and automate
							restocking — all from one powerful dashboard.
						</p>
					</div>
					<div className="space-y-2.5">
						{[
							"Real-time stock tracking",
							"Low-stock alerts & automation",
							"Role-based access control",
						].map((f) => (
							<div key={f} className="flex items-center gap-2.5">
								<div className="w-4 h-4 rounded-full bg-white/25 flex items-center justify-center flex-shrink-0">
									<div className="w-1.5 h-1.5 rounded-full bg-white" />
								</div>
								<span className="text-indigo-100/80 text-sm">
									{f}
								</span>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* ── RIGHT PANEL ── */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, ease: "easeOut" }}
				className="flex-1 bg-[#13151C] flex items-center justify-center p-6 sm:p-10 overflow-y-auto"
			>
				<div className="w-full max-w-sm">
					{/* Mobile logo */}
					<div className="flex items-center gap-2 mb-6 sm:hidden">
						<Package className="text-indigo-400 w-5 h-5" />
						<span className="text-white font-bold">
							InventoryOS
						</span>
					</div>

					<div className="mb-6">
						<h2 className="text-white text-2xl font-bold tracking-tight">
							Welcome back
						</h2>
						<p className="text-zinc-400 text-sm mt-1.5">
							Sign in to your account to continue
						</p>
					</div>

					<form
						onSubmit={handleSubmit(onSubmit)}
						className="space-y-4"
					>
						<div className="space-y-1.5">
							<Label
								htmlFor="email"
								className="text-zinc-300 text-sm font-medium"
							>
								Email address
							</Label>
							<Input
								id="email"
								type="email"
								autoComplete="email"
								placeholder="you@company.com"
								className="bg-[#1C1F2A] border-zinc-700/60 text-white placeholder:text-zinc-600 focus:border-indigo-500 h-10"
								{...register("email")}
							/>
							{errors.email && (
								<p className="text-red-400 text-xs">
									{errors.email.message}
								</p>
							)}
						</div>

						<div className="space-y-1.5">
							<Label
								htmlFor="password"
								className="text-zinc-300 text-sm font-medium"
							>
								Password
							</Label>
							<Input
								id="password"
								type="password"
								autoComplete="current-password"
								placeholder="••••••••"
								className="bg-[#1C1F2A] border-zinc-700/60 text-white placeholder:text-zinc-600 focus:border-indigo-500 h-10"
								{...register("password")}
							/>
							{errors.password && (
								<p className="text-red-400 text-xs">
									{errors.password.message}
								</p>
							)}
						</div>

						{serverError && (
							<div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3.5 py-2.5">
								{serverError}
							</div>
						)}

						<Button
							type="submit"
							disabled={isSubmitting}
							className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium h-10"
						>
							{isSubmitting && !loadingRole ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
									Signing in...
								</>
							) : (
								"Sign In"
							)}
						</Button>
					</form>

					{/* Demo Accounts */}
					<div className="mt-6">
						<div className="flex items-center gap-3 mb-4">
							<div className="flex-1 h-px bg-zinc-800" />
							<span className="text-zinc-500 text-xs whitespace-nowrap">
								Try a demo account
							</span>
							<div className="flex-1 h-px bg-zinc-800" />
						</div>

						<div className="grid grid-cols-2 gap-2">
							{DEMO_ACCOUNTS.map((account) => {
								const isLoading = loadingRole === account.role;
								return (
									<button
										key={account.role}
										type="button"
										onClick={() => handleDemoLogin(account)}
										disabled={!!loadingRole}
										className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border bg-white/3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${account.border} ${account.bg}`}
									>
										{isLoading ? (
											<Loader2
												className={`w-6 h-6 animate-spin ${account.iconColor}`}
											/>
										) : (
											<div
												className={`w-9 h-9 rounded-lg border flex items-center justify-center text-lg ${account.iconBg}`}
											>
												{account.icon}
											</div>
										)}
										<div className="text-center">
											<p className="text-white text-xs font-semibold leading-tight">
												{account.label}
											</p>
											<p className="text-zinc-500 text-xs leading-tight">
												{account.description}
											</p>
										</div>
									</button>
								);
							})}
						</div>
					</div>

					<p className="text-center text-zinc-500 text-sm mt-6">
						Don&apos;t have an account?{" "}
						<Link
							href="/register"
							className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
						>
							Create one
						</Link>
					</p>
				</div>
			</motion.div>
		</div>
	);
}
