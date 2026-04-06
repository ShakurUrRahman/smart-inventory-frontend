"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
	ShoppingBag,
	Clock,
	AlertTriangle,
	DollarSign,
	Package,
	ShoppingCart,
	ArrowUp,
	User,
	ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
	Legend,
} from "recharts";
import { PageHeader } from "@/components/layout/PageHeader";
import { dashboardApi } from "@/lib/dashboardApi";
import { SkeletonGrid } from "@/components/shared/Skeleton";
import { formatDistanceToNow } from "date-fns";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import UserDashboard from "@/components/dashboard/UserDashboard";
import { useAuthStore } from "@/store/authStore";

const STAT_COLORS = [
	{ icon: "indigo", bg: "bg-indigo-500/20" },
	{ icon: "amber", bg: "bg-amber-500/20" },
	{ icon: "red", bg: "bg-red-500/20" },
	{ icon: "green", bg: "bg-green-500/20" },
];

const STATUS_COLORS: Record<string, string> = {
	Pending: "#F59E0B",
	Confirmed: "#3B82F6",
	Shipped: "#8B5CF6",
	Delivered: "#10B981",
	Cancelled: "#6B7280",
};

const ACTIVITY_COLORS: Record<string, string> = {
	Order: "bg-indigo-500/20 text-indigo-400",
	Stock: "bg-green-500/20 text-green-400",
	Product: "bg-blue-500/20 text-blue-400",
	User: "bg-violet-500/20 text-violet-400",
};

function AnimatedNumber({ value }: { value: number }) {
	const [displayValue, setDisplayValue] = useState(0);

	useEffect(() => {
		let interval: NodeJS.Timeout;
		if (displayValue < value) {
			interval = setInterval(() => {
				setDisplayValue((prev) =>
					Math.min(prev + Math.ceil(value / 20), value),
				);
			}, 30);
		}
		return () => clearInterval(interval);
	}, [value]);

	return <span>{displayValue}</span>;
}

export default function DashboardPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user } = useAuthStore();

	// ── Handle unauthorized redirect from middleware ────────────────────────
	useEffect(() => {
		if (searchParams.get("error") === "unauthorized") {
			toast.error("You don't have permission to access that page.");
			// Remove the query param from URL without full reload
			router.replace("/dashboard");
		}
	}, [searchParams, router]);

	// Fetch all dashboard data
	const { data: stats, isLoading: statsLoading } = useQuery({
		queryKey: ["dashboard-stats"],
		queryFn: dashboardApi.getStats,
		refetchInterval: 60000, // Refresh every 60 seconds
	});

	const { data: ordersChart = [] } = useQuery({
		queryKey: ["orders-chart"],
		queryFn: dashboardApi.getOrdersChart,
	});

	const { data: revenueChart = [] } = useQuery({
		queryKey: ["revenue-chart"],
		queryFn: dashboardApi.getRevenueChart,
	});

	const { data: productSummary = [] } = useQuery({
		queryKey: ["product-summary"],
		queryFn: dashboardApi.getProductSummary,
	});

	const { data: statusBreakdown = [] } = useQuery({
		queryKey: ["status-breakdown"],
		queryFn: dashboardApi.getStatusBreakdown,
	});

	const { data: recentActivity = [] } = useQuery({
		queryKey: ["dashboard-activity"],
		queryFn: dashboardApi.getRecentActivity,
		staleTime: 30000,
		gcTime: 60000,
		refetchInterval: 30000,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	if (user?.role === "user") {
		return <UserDashboard />; // simple view showing their submissions
	}

	if (statsLoading) {
		return (
			<>
				<PageHeader title="Dashboard" subtitle="Inventory overview" />
				{/* ROW 1: 4 stat cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
					{[...Array(4)].map((_, idx) => (
						<SkeletonGrid key={idx} count={1} variant="card" />
					))}
				</div>
				{/* ROW 2: 3 chart cards */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
					<SkeletonGrid count={1} variant="card" />
					<SkeletonGrid count={1} variant="card" />
					<SkeletonGrid count={1} variant="card" />
					<SkeletonGrid count={1} variant="card" />
				</div>
				{/* ROW 3: Product summary + Activity */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<SkeletonGrid count={1} variant="card" />
					<SkeletonGrid count={1} variant="card" />
				</div>
			</>
		);
	}

	const statCards = [
		{
			icon: Package,
			value: stats?.totalProducts || 0,
			label: "Total Products",
			subtext: `${stats?.totalCategories || 0} categories`,
			subColor: "text-zinc-400",
			color: "indigo",
		},
		{
			icon: Clock,
			value: stats?.pendingOrders || 0,
			label: "Pending Orders",
			subtext: `${stats?.confirmedOrders || 0} confirmed`,
			subColor: "text-blue-400",
			color: "amber",
		},
		{
			icon: AlertTriangle,
			value: stats?.lowStockCount || 0,
			label: "Low Stock Items",
			subtext: stats?.lowStockCount ? "Need attention" : "All good ✅",
			subColor: stats?.lowStockCount ? "text-red-400" : "text-green-400",
			color: "red",
			onClick: () => router.push("/restock"),
			clickable: true,
		},
		{
			icon: DollarSign,
			value: `$${(stats?.totalRevenue || 0).toFixed(0)}`,
			label: "Total Revenue",
			subtext: `Generated from ${stats?.totalOrders || 0} orders`,

			subColor: "text-green-400",
			color: "green",
		},
	];

	return (
		<>
			<PageHeader
				title={`Welcome, ${user?.name} 👋`}
				subtitle="Track your inventory and their pending approvals"
			/>

			{/* ROW 1: STAT CARDS */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				{statCards.map((card, idx) => {
					const Icon = card.icon;
					const colorClass =
						card.color === "indigo"
							? "bg-indigo-500/20 text-indigo-400"
							: card.color === "amber"
								? "bg-amber-500/20 text-amber-400"
								: card.color === "red"
									? "bg-red-500/20 text-red-400"
									: "bg-green-500/20 text-green-400";

					return (
						<motion.div
							key={idx}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: idx * 0.1 }}
							className={`bg-[#13161F] border border-white/10 rounded-2xl p-6 backdrop-blur ${
								card.clickable
									? "cursor-pointer hover:bg-white/5 transition-colors"
									: ""
							}`}
							onClick={card.onClick}
						>
							<div className="flex items-start justify-between">
								<div>
									<p className="text-zinc-400 text-sm mb-2">
										{card.label}
									</p>
									<p className="text-3xl font-bold text-white mb-3">
										{typeof card.value === "number" ? (
											<AnimatedNumber
												value={card.value}
											/>
										) : (
											card.value
										)}
									</p>
									{card.trend && (
										<p className="text-xs text-green-400 flex items-center gap-1">
											<ArrowUp className="w-3 h-3" />{" "}
											{card.trend}
										</p>
									)}
									{card.subtext && (
										<p
											className={`text-xs ${card.subColor}`}
										>
											{card.subtext}
										</p>
									)}
								</div>
								<div className={`p-3 rounded-xl ${colorClass}`}>
									<Icon className="w-6 h-6" />
								</div>
							</div>
						</motion.div>
					);
				})}
			</div>

			{/* ROW 2: CHARTS */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
				{/* Orders Chart */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4 }}
					className="bg-[#13161F] border border-white/10 rounded-2xl p-6 backdrop-blur"
				>
					<h3 className="text-lg font-semibold text-white mb-6">
						Orders — Last 7 Days
					</h3>
					<ResponsiveContainer width="100%" height={300}>
						<BarChart data={ordersChart}>
							<CartesianGrid
								strokeDasharray="3 3"
								stroke="rgba(255,255,255,0.05)"
							/>
							<XAxis
								dataKey="date"
								stroke="rgba(255,255,255,0.4)"
								style={{ fontSize: "12px" }}
							/>
							<YAxis
								stroke="rgba(255,255,255,0.4)"
								style={{ fontSize: "12px" }}
							/>
							<Tooltip
								contentStyle={{
									backgroundColor: "#1C1F2A",
									border: "1px solid rgba(255,255,255,0.1)",
									borderRadius: "8px",
								}}
								labelStyle={{ color: "white" }}
							/>
							<Bar
								dataKey="count"
								fill="#6366F1"
								radius={[8, 8, 0, 0]}
							/>
						</BarChart>
					</ResponsiveContainer>
				</motion.div>

				{/* Revenue Chart */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.45 }}
					className="bg-[#13161F] border border-white/10 rounded-2xl p-6 backdrop-blur"
				>
					<h3 className="text-lg font-semibold text-white mb-6">
						Revenue — Last 7 Days
					</h3>
					<ResponsiveContainer width="100%" height={300}>
						<BarChart data={revenueChart}>
							<CartesianGrid
								strokeDasharray="3 3"
								stroke="rgba(255,255,255,0.05)"
							/>
							<XAxis
								dataKey="date"
								stroke="rgba(255,255,255,0.4)"
								style={{ fontSize: "12px" }}
							/>
							<YAxis
								stroke="rgba(255,255,255,0.4)"
								style={{ fontSize: "12px" }}
							/>
							<Tooltip
								contentStyle={{
									backgroundColor: "#1C1F2A",
									border: "1px solid rgba(255,255,255,0.1)",
									borderRadius: "8px",
								}}
								labelStyle={{ color: "white" }}
								formatter={(value) => `$${value.toFixed(2)}`}
							/>
							<Bar
								dataKey="revenue"
								fill="#10B981"
								radius={[8, 8, 0, 0]}
							/>
						</BarChart>
					</ResponsiveContainer>
				</motion.div>

				{/* Status Breakdown Pie */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.5 }}
					className="bg-[#13161F] border border-white/10 rounded-2xl p-6 backdrop-blur"
				>
					<h3 className="text-lg font-semibold text-white mb-6">
						Order Status Breakdown
					</h3>
					<ResponsiveContainer width="100%" height={300}>
						<PieChart>
							<Pie
								data={statusBreakdown}
								cx="50%"
								cy="50%"
								innerRadius={50}
								outerRadius={80}
								paddingAngle={2}
								dataKey="count"
								nameKey="status"
							>
								{statusBreakdown.map((entry, index) => (
									<Cell
										key={`cell-${index}`}
										fill={
											STATUS_COLORS[entry.status] ||
											"#6B7280"
										}
									/>
								))}
							</Pie>
							<Tooltip
								contentStyle={{
									backgroundColor: "#1a1d28",
									border: "1px solid rgba(255,255,255,0.1)",
									borderRadius: "8px",
									color: "white",
									fontSize: "12px",
								}}
								formatter={(value: any, name: any) => [
									value,
									name,
								]}
							/>
							<Legend
								layout="horizontal"
								align="center"
								verticalAlign="bottom"
								wrapperStyle={{
									color: "white",
									fontSize: "11px",
									paddingTop: "16px",
								}}
							/>
						</PieChart>
					</ResponsiveContainer>
				</motion.div>

				{/* Revenue by Category */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.55 }}
					className="bg-[#13161F] border border-white/10 rounded-2xl p-6 backdrop-blur"
				>
					<h3 className="text-lg font-semibold text-white mb-6">
						Top Categories by Revenue
					</h3>
					<div className="space-y-4">
						{productSummary.slice(0, 5).length > 0 ? (
							(() => {
								// Group products by category and sum revenue
								const categoryRevenue: Record<string, number> =
									{};
								productSummary.forEach((product) => {
									const revenue =
										product.stock * product.price;
									categoryRevenue[product.category] =
										(categoryRevenue[product.category] ||
											0) + revenue;
								});

								// Sort by revenue descending and get top 5
								const topCategories = Object.entries(
									categoryRevenue,
								)
									.sort(([, a], [, b]) => b - a)
									.slice(0, 5);

								const maxRevenue = Math.max(
									...topCategories.map(([, v]) => v),
									1,
								);

								return topCategories.map(
									([category, revenue], idx) => {
										const percentage =
											(revenue / maxRevenue) * 100;

										return (
											<div
												key={idx}
												className="space-y-2"
											>
												<div className="flex items-center justify-between">
													<p className="text-sm text-white truncate">
														{category}
													</p>
													<p className="text-xs text-zinc-400">
														${revenue.toFixed(2)}
													</p>
												</div>
												<div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
													<div
														className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all"
														style={{
															width: `${percentage}%`,
														}}
													></div>
												</div>
											</div>
										);
									},
								);
							})()
						) : (
							<p className="text-zinc-400 text-sm py-4">
								No category data
							</p>
						)}
					</div>
				</motion.div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Product Summary Table (66%) */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.6 }}
					className="lg:col-span-2 bg-[#13161F] border border-white/10 rounded-2xl p-6 backdrop-blur flex flex-col h-[420px]"
				>
					<div className="flex items-center justify-between mb-6 flex-shrink-0">
						{" "}
						{/* ← flex-shrink-0 */}
						<h3 className="text-lg font-semibold text-white">
							Product Stock Summary
						</h3>
						<Link
							href="/products"
							className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
						>
							View All <ChevronRight className="w-3 h-3" />
						</Link>
					</div>

					<div className="overflow-y-auto overflow-x-hidden space-y-1 flex-1">
						{" "}
						{/* ← flex-1 to fill height */}
						{productSummary.length > 0 ? (
							productSummary.map((product, idx) => {
								const percentage =
									(product.stock /
										product.minStockThreshold) *
									100;
								const isLow =
									product.stock <= product.minStockThreshold;
								const isOutOfStock = product.stock === 0;

								return (
									<div
										key={idx}
										className="flex items-center justify-between py-3 px-3 hover:bg-white/5 rounded-lg transition"
									>
										<div className="flex-1 min-w-0">
											<p className="text-sm text-white font-medium truncate">
												{product.name}
											</p>
											<p className="text-xs text-zinc-400">
												{product.category}
											</p>
										</div>
										<div className="flex items-center gap-4 ml-4">
											{isOutOfStock ? (
												<span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
													Out of Stock
												</span>
											) : (
												<span
													className={`text-sm font-semibold ${isLow ? "text-amber-400" : "text-green-400"}`}
												>
													{product.stock}
												</span>
											)}
										</div>
									</div>
								);
							})
						) : (
							<p className="text-zinc-400 text-sm py-4">
								No products
							</p>
						)}
					</div>
				</motion.div>

				{/* Activity Feed (34%) */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.7 }}
					className="bg-[#13161F] border border-white/10 rounded-2xl p-6 backdrop-blur flex flex-col h-[420px]"
				>
					<div className="flex items-center justify-between mb-6 flex-shrink-0">
						{" "}
						{/* ← flex-shrink-0 */}
						<h3 className="text-lg font-semibold text-white">
							Recent Activity
						</h3>
						<Link
							href="/activity"
							className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
						>
							View All <ChevronRight className="w-3 h-3" />
						</Link>
					</div>

					<div className="overflow-y-auto overflow-x-hidden space-y-3 flex-1">
						{" "}
						{/* ← flex-1 instead of max-h-96 */}
						{recentActivity.length > 0 ? (
							recentActivity.slice(0, 15).map((activity, idx) => {
								const iconClass =
									ACTIVITY_COLORS[activity.entityType] ||
									"bg-gray-500/20 text-gray-400";
								let Icon = Package;
								if (activity.entityType === "Order")
									Icon = ShoppingCart;
								else if (activity.entityType === "Stock")
									Icon = ArrowUp;
								else if (activity.entityType === "User")
									Icon = User;

								return (
									<div
										key={idx}
										className="flex items-start gap-3 pb-3 border-b border-white/5 last:border-b-0"
									>
										<div
											className={`p-2 rounded-lg ${iconClass} flex-shrink-0`}
										>
											<Icon className="w-4 h-4" />
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-sm text-white truncate">
												{activity.description}
											</p>
											<p className="text-xs text-zinc-400">
												{formatDistanceToNow(
													new Date(
														activity.createdAt,
													),
													{ addSuffix: true },
												)}
											</p>
										</div>
									</div>
								);
							})
						) : (
							<p className="text-zinc-400 text-sm py-4">
								No recent activity
							</p>
						)}
					</div>
				</motion.div>
			</div>
		</>
	);
}
