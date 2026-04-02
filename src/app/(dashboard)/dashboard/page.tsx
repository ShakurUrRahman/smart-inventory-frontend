"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
		queryKey: ["activity"],
		queryFn: dashboardApi.getRecentActivity,
		refetchInterval: 30000, // Refresh every 30 seconds
	});

	if (statsLoading) {
		return (
			<>
				<PageHeader title="Dashboard" subtitle="Inventory overview" />
				<SkeletonGrid count={12} variant="card" />
			</>
		);
	}

	const statCards = [
		{
			icon: ShoppingBag,
			value: stats?.totalOrdersToday || 0,
			label: "Orders Today",
			trend: "+3 from yesterday",
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
			value: `$${(stats?.revenueToday || 0).toFixed(2)}`,
			label: "Revenue Today",
			subtext: `${stats?.deliveredOrders || 0} orders delivered`,
			subColor: "text-green-400",
			color: "green",
		},
	];

	return (
		<>
			<PageHeader title="Dashboard" subtitle="Inventory overview" />

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
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
				{/* Orders Chart (60%) */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4 }}
					className="lg:col-span-2 bg-[#13161F] border border-white/10 rounded-2xl p-6 backdrop-blur"
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

				{/* Status Breakdown Pie (40%) */}
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
								innerRadius={60}
								outerRadius={100}
								paddingAngle={2}
								dataKey="count"
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
							<Legend
								layout="vertical"
								align="right"
								verticalAlign="middle"
								wrapperStyle={{
									color: "white",
									fontSize: "12px",
								}}
							/>
						</PieChart>
					</ResponsiveContainer>
				</motion.div>
			</div>

			{/* ROW 3: TABLES */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Product Summary Table (60%) */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.6 }}
					className="lg:col-span-2 bg-[#13161F] border border-white/10 rounded-2xl p-6 backdrop-blur"
				>
					<div className="flex items-center justify-between mb-6">
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

					<div className="space-y-1">
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
													className={`text-sm font-semibold ${
														isLow
															? "text-amber-400"
															: "text-green-400"
													}`}
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

				{/* Activity Feed (40%) */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.7 }}
					className="bg-[#13161F] border border-white/10 rounded-2xl p-6 backdrop-blur"
				>
					<div className="flex items-center justify-between mb-6">
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

					<div className="space-y-3 max-h-96 overflow-y-auto">
						{recentActivity.length > 0 ? (
							recentActivity.map((activity, idx) => {
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
													{
														addSuffix: true,
													},
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
