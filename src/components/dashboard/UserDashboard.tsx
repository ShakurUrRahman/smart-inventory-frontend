"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { productsApi } from "@/lib/productsApi";
import { PageHeader } from "@/components/layout/PageHeader";
import { motion } from "framer-motion";
import { Package, Clock, CheckCircle, XCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

const APPROVAL_COLORS: Record<string, string> = {
	approved: "bg-green-500/20 text-green-400 border-green-500/30",
	pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
	rejected: "bg-red-500/20 text-red-400 border-red-500/30",
};

const APPROVAL_ICONS: Record<string, any> = {
	approved: CheckCircle,
	pending: Clock,
	rejected: XCircle,
};

export default function UserDashboard() {
	const { user } = useAuthStore();
	const router = useRouter();

	const { data: productsData, isLoading } = useQuery({
		queryKey: ["products", { user: user?.id }],
		queryFn: () => productsApi.getAllProducts({ limit: 100 }),
	});

	const products = productsData?.data || [];

	const stats = {
		total: products.length,
		approved: products.filter((p: any) => p.approvalStatus === "approved")
			.length,
		pending: products.filter((p: any) => p.approvalStatus === "pending")
			.length,
		rejected: products.filter((p: any) => p.approvalStatus === "rejected")
			.length,
	};

	const statCards = [
		{
			label: "Total Submitted",
			value: stats.total,
			icon: Package,
			color: "bg-indigo-500/20 text-indigo-400",
			border: "border-indigo-500/20",
		},
		{
			label: "Approved",
			value: stats.approved,
			icon: CheckCircle,
			color: "bg-green-500/20 text-green-400",
			border: "border-green-500/20",
		},
		{
			label: "Pending Review",
			value: stats.pending,
			icon: Clock,
			color: "bg-amber-500/20 text-amber-400",
			border: "border-amber-500/20",
		},
		{
			label: "Rejected",
			value: stats.rejected,
			icon: XCircle,
			color: "bg-red-500/20 text-red-400",
			border: "border-red-500/20",
		},
	];

	return (
		<>
			<PageHeader
				title={`Welcome, ${user?.name} 👋`}
				subtitle="Track your product submissions and their approval status"
				action={
					<Button
						onClick={() => router.push("/products")}
						className="bg-indigo-600 hover:bg-indigo-500 gap-2"
					>
						<Plus className="w-4 h-4" />
						<span className="hidden sm:inline">Submit Product</span>
					</Button>
				}
			/>

			{/* Stat Cards */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
				{statCards.map((card, idx) => {
					const Icon = card.icon;
					return (
						<motion.div
							key={idx}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: idx * 0.1 }}
							className={`bg-[#13161F] border ${card.border} rounded-2xl p-4 sm:p-6`}
						>
							<div className="flex items-start justify-between">
								<div>
									<p className="text-zinc-400 text-xs sm:text-sm mb-2">
										{card.label}
									</p>
									<p className="text-2xl sm:text-3xl font-bold text-white">
										{card.value}
									</p>
								</div>
								<div
									className={`p-2.5 rounded-xl ${card.color}`}
								>
									<Icon className="w-5 h-5" />
								</div>
							</div>
						</motion.div>
					);
				})}
			</div>

			{/* Recent Submissions */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.4 }}
				className="bg-[#13161F] border border-white/10 rounded-2xl p-6"
			>
				<div className="flex items-center justify-between mb-6">
					<h3 className="text-lg font-semibold text-white">
						My Product Submissions
					</h3>
					<button
						onClick={() => router.push("/products")}
						className="text-xs text-indigo-400 hover:text-indigo-300"
					>
						View All →
					</button>
				</div>

				{isLoading ? (
					<div className="space-y-3">
						{Array.from({ length: 5 }).map((_, i) => (
							<div
								key={i}
								className="flex items-center gap-4 p-3 rounded-lg"
							>
								<div className="h-10 w-10 bg-white/10 rounded-lg animate-pulse flex-shrink-0" />
								<div className="flex-1 space-y-2">
									<div className="h-4 w-48 bg-white/10 rounded animate-pulse" />
									<div className="h-3 w-32 bg-white/10 rounded animate-pulse" />
								</div>
								<div className="h-6 w-20 bg-white/10 rounded-full animate-pulse" />
							</div>
						))}
					</div>
				) : products.length === 0 ? (
					<div className="text-center py-12">
						<Package className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
						<p className="text-zinc-400 text-sm mb-4">
							You haven&apos;t submitted any products yet
						</p>
						<Button
							onClick={() => router.push("/products")}
							className="bg-indigo-600 hover:bg-indigo-500 gap-2"
						>
							<Plus className="w-4 h-4" />
							Submit First Product
						</Button>
					</div>
				) : (
					<div className="space-y-2">
						{products
							.slice(0, 8)
							.map((product: any, idx: number) => {
								const StatusIcon =
									APPROVAL_ICONS[product.approvalStatus] ||
									Clock;
								return (
									<motion.div
										key={product._id}
										initial={{ opacity: 0, x: -10 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: 0.1 + idx * 0.05 }}
										className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors"
									>
										{/* Icon */}
										<div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
											<Package className="w-5 h-5 text-indigo-400" />
										</div>

										{/* Info */}
										<div className="flex-1 min-w-0">
											<p className="text-white text-sm font-medium truncate">
												{product.name}
											</p>
											<p className="text-zinc-500 text-xs mt-0.5">
												{typeof product.category ===
												"object"
													? product.category?.name
													: product.category}{" "}
												· ${product.price.toFixed(2)} ·{" "}
												{formatDistanceToNow(
													new Date(product.createdAt),
													{
														addSuffix: true,
													},
												)}
											</p>
										</div>

										{/* Status badge */}
										<span
											className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 flex-shrink-0 ${
												APPROVAL_COLORS[
													product.approvalStatus
												]
											}`}
										>
											<StatusIcon className="w-3 h-3" />
											<span className="hidden sm:inline capitalize">
												{product.approvalStatus}
											</span>
										</span>
									</motion.div>
								);
							})}
					</div>
				)}

				{/* Pending notice */}
				{stats.pending > 0 && (
					<div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
						<Clock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
						<p className="text-amber-400 text-xs">
							You have {stats.pending} product
							{stats.pending !== 1 ? "s" : ""} awaiting review. An
							admin will approve or reject them shortly.
						</p>
					</div>
				)}

				{/* Rejected notice */}
				{stats.rejected > 0 && (
					<div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
						<XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
						<p className="text-red-400 text-xs">
							You have {stats.rejected} rejected product
							{stats.rejected !== 1 ? "s" : ""}. Edit and resubmit
							them from the Products page.
						</p>
					</div>
				)}
			</motion.div>
		</>
	);
}
