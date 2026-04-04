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
import { toast } from "sonner";
import { registerUser } from "@/lib/authApi";
import { useAuthStore } from "@/store/authStore";

const registerSchema = z
	.object({
		name: z.string().min(2, "Name must be at least 2 characters"),
		email: z.string().email("Please enter a valid email address"),
		password: z.string().min(6, "Password must be at least 6 characters"),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
	const router = useRouter();
	const [serverError, setServerError] = useState<string | null>(null);

	const { user, isHydrated } = useAuthStore();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<RegisterFormData>({
		resolver: zodResolver(registerSchema),
	});

	useEffect(() => {
		if (isHydrated && user) {
			router.replace("/dashboard");
		}
	}, [user, isHydrated, router]);

	// Don't render login form until hydration is complete
	// if (!isHydrated) return null;
	// if (user) return null; //

	const onSubmit = async (data: RegisterFormData) => {
		try {
			setServerError(null);
			await registerUser(data.name, data.email, data.password);
			toast.success("Account created! Please sign in.");
			router.push("/login");
		} catch (err: any) {
			const errorMsg =
				err.message || "Registration failed. Please try again.";
			setServerError(errorMsg);
			toast.error(errorMsg);
		}
	};

	return (
		<div className="w-full max-w-5xl flex rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-white/5">
			{/* ── LEFT PANEL ── */}
			<div className="hidden sm:flex flex-col justify-between w-[45%] bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 p-10 relative overflow-hidden">
				{/* Dot grid */}
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
							Join thousands of businesses managing their
							inventory smarter with InventoryOS.
						</p>
					</div>

					<div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
						<p className="text-white/90 text-sm font-medium">
							&ldquo;InventoryOS cut our overstock by 40% in the
							first month.&rdquo;
						</p>
						<p className="text-indigo-200/70 text-xs mt-2">
							— Operations Manager, RetailCo
						</p>
					</div>
				</div>
			</div>

			{/* ── RIGHT PANEL ── */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, ease: "easeOut" }}
				className="flex-1 bg-[#13151C] flex items-center justify-center p-8 sm:p-12"
			>
				<div className="w-full max-w-sm">
					{/* Mobile logo */}
					<div className="flex items-center gap-2 mb-8 sm:hidden">
						<Package className="text-indigo-400 w-5 h-5" />
						<span className="text-white font-bold">
							InventoryOS
						</span>
					</div>

					<div className="mb-8">
						<h2 className="text-white text-2xl font-bold tracking-tight">
							Create an account
						</h2>
						<p className="text-zinc-400 text-sm mt-1.5">
							Get started with InventoryOS for free
						</p>
					</div>

					<form
						onSubmit={handleSubmit(onSubmit)}
						className="space-y-4"
					>
						{/* Full Name */}
						<div className="space-y-1.5">
							<Label
								htmlFor="name"
								className="text-zinc-300 text-sm font-medium"
							>
								Full Name
							</Label>
							<Input
								id="name"
								type="text"
								autoComplete="name"
								placeholder="John Doe"
								className="bg-[#1C1F2A] border-zinc-700/60 text-white placeholder:text-zinc-600 
                           focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 
                           h-10 transition-colors"
								{...register("name")}
							/>
							{errors.name && (
								<p className="text-red-400 text-xs">
									{errors.name.message}
								</p>
							)}
						</div>

						{/* Email */}
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
								className="bg-[#1C1F2A] border-zinc-700/60 text-white placeholder:text-zinc-600 
                           focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 
                           h-10 transition-colors"
								{...register("email")}
							/>
							{errors.email && (
								<p className="text-red-400 text-xs">
									{errors.email.message}
								</p>
							)}
						</div>

						{/* Password */}
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
								autoComplete="new-password"
								placeholder="Min. 6 characters"
								className="bg-[#1C1F2A] border-zinc-700/60 text-white placeholder:text-zinc-600 
                           focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 
                           h-10 transition-colors"
								{...register("password")}
							/>
							{errors.password && (
								<p className="text-red-400 text-xs">
									{errors.password.message}
								</p>
							)}
						</div>

						{/* Confirm Password */}
						<div className="space-y-1.5">
							<Label
								htmlFor="confirmPassword"
								className="text-zinc-300 text-sm font-medium"
							>
								Confirm Password
							</Label>
							<Input
								id="confirmPassword"
								type="password"
								autoComplete="new-password"
								placeholder="••••••••"
								className="bg-[#1C1F2A] border-zinc-700/60 text-white placeholder:text-zinc-600 
                           focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 
                           h-10 transition-colors"
								{...register("confirmPassword")}
							/>
							{errors.confirmPassword && (
								<p className="text-red-400 text-xs">
									{errors.confirmPassword.message}
								</p>
							)}
						</div>

						{/* Server error */}
						{serverError && (
							<div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3.5 py-2.5">
								{serverError}
							</div>
						)}

						{/* Submit */}
						<Button
							type="submit"
							disabled={isSubmitting}
							className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 
                         text-white font-medium h-10 transition-colors mt-2"
						>
							{isSubmitting ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									Creating account...
								</>
							) : (
								"Create Account"
							)}
						</Button>
					</form>

					<p className="text-center text-zinc-500 text-sm mt-6">
						Already have an account?{" "}
						<Link
							href="/login"
							className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
						>
							Sign in
						</Link>
					</p>
				</div>
			</motion.div>
		</div>
	);
}
