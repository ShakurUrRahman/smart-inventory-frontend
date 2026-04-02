"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { ShoppingCart, Package, ArrowUp, User, Tag } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import apiClient from "@/lib/api";

const ENTITY_TYPES = ["all", "Order", "Product", "Stock", "User", "Category"];

const ENTITY_COLORS: Record<string, { bg: string; text: string; dot: string }> =
	{
		Order: {
			bg: "bg-indigo-500/20",
			text: "text-indigo-400",
			dot: "bg-indigo-500",
		},
		Product: {
			bg: "bg-blue-500/20",
			text: "text-blue-400",
			dot: "bg-blue-500",
		},
		Stock: {
			bg: "bg-green-500/20",
			text: "text-green-400",
			dot: "bg-green-500",
		},
		User: {
			bg: "bg-violet-500/20",
			text: "text-violet-400",
			dot: "bg-violet-500",
		},
		Category: {
			bg: "bg-amber-500/20",
			text: "text-amber-400",
			dot: "bg-amber-500",
		},
		RestockQueue: {
			bg: "bg-rose-500/20",
			text: "text-rose-400",
			dot: "bg-rose-500",
		},
	};

const ENTITY_ICONS: Record<string, any> = {
	Order: ShoppingCart,
	Product: Package,
	Stock: ArrowUp,
	User: User,
	Category: Tag,
	RestockQueue: ArrowUp,
};

interface ActivityEntry {
	_id: string;
	action: string;
	entityType: string;
	description: string;
	createdAt: string;
	userId?: { name: string };
	performedBy?: { name: string };
}

interface ActivityResponse {
	success: boolean;
	data: ActivityEntry[];
	total: number;
	page: number;
	totalPages: number;
	limit: number;
}

async function getActivityLogs(params: {
	entityType?: string;
	page?: number;
	limit?: number;
}): Promise<ActivityResponse> {
	const query = new URLSearchParams();
	if (params.entityType && params.entityType !== "all") {
		query.append("entityType", params.entityType);
	}
	if (params.page) query.append("page", params.page.toString());
	if (params.limit) query.append("limit", params.limit.toString());

	const response = await apiClient.get(`/activity?${query.toString()}`);
	return response.data;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function ActivitySkeleton() {
	const dotColors = [
		"bg-indigo-500",
		"bg-blue-500",
		"bg-green-500",
		"bg-violet-500",
		"bg-amber-500",
	];

	return (
		<div className="max-w-3xl mx-auto space-y-6">
			{Array.from({ length: 5 }).map((_, i) => (
				<div key={i} className="relative">
					{/* Timeline dot and line */}
					<div className="absolute left-0 top-0 w-12 flex justify-center">
						<div className="relative flex flex-col items-center">
							<div
								className={`w-6 h-6 rounded-full ${dotColors[i % dotColors.length]} border-4 border-[#0a0d12] animate-pulse`}
							/>
							{i < 4 && (
								<div
									className={`w-1 h-24 ${dotColors[i % dotColors.length]} opacity-30 mt-2`}
								/>
							)}
						</div>
					</div>

					{/* Card skeleton */}
					<div className="ml-20 bg-[#13161F] border border-white/10 rounded-xl p-5">
						<div className="flex items-start justify-between gap-4 mb-3">
							<div className="flex-1 space-y-2">
								{/* Time */}
								<div className="h-3 w-32 bg-white/10 rounded animate-pulse" />
								{/* Description */}
								<div className="h-4 w-3/4 bg-white/10 rounded animate-pulse" />
								{/* Second line of description */}
								<div className="h-4 w-1/2 bg-white/10 rounded animate-pulse" />
								{/* By user */}
								<div className="h-3 w-24 bg-white/10 rounded animate-pulse mt-1" />
							</div>
							{/* Badge */}
							<div className="h-6 w-20 bg-white/10 rounded-full animate-pulse flex-shrink-0" />
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

export default function ActivityPage() {
	const searchParams = useSearchParams();
	const router = useRouter();

	const [entityFilter, setEntityFilter] = useState(
		searchParams.get("entityType") || "all",
	);
	const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));

	const LIMIT = 10;

	const updateUrl = (newFilter: string, newPage: number) => {
		const params = new URLSearchParams();
		if (newFilter && newFilter !== "all")
			params.set("entityType", newFilter);
		if (newPage > 1) params.set("page", newPage.toString());
		router.push(`/activity?${params.toString()}`);
	};

	const { data: activityData, isLoading } = useQuery({
		queryKey: ["activity-logs", { entityFilter, page }],
		queryFn: () =>
			getActivityLogs({ entityType: entityFilter, page, limit: LIMIT }),
	});

	const logs = activityData?.data || [];
	const total = activityData?.total || 0;
	const totalPages = activityData?.totalPages || 1;
	const isEmpty = logs.length === 0 && !isLoading;

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

	const formatTime = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		});
	};

	return (
		<>
			<PageHeader title="Activity Log" subtitle="Full system history" />

			{/* Entity Type Filter Tabs */}
			<div className="flex gap-3 mb-8 border-b border-white/10 pb-4 flex-wrap">
				{ENTITY_TYPES.map((type) => (
					<button
						key={type}
						onClick={() => {
							setEntityFilter(type);
							setPage(1);
							updateUrl(type, 1);
						}}
						className={`px-4 py-2 rounded-t-lg font-medium transition-colors capitalize ${
							entityFilter === type
								? "text-indigo-400 border-b-2 border-indigo-400"
								: "text-zinc-400 hover:text-zinc-300"
						}`}
					>
						{type}
					</button>
				))}
			</div>

			{/* Loading State */}
			{isLoading && <ActivitySkeleton />}

			{/* Empty State */}
			{isEmpty && (
				<div className="flex flex-col items-center justify-center py-16 px-4">
					<div className="text-center">
						<div className="text-5xl mb-4">📋</div>
						<h3 className="text-lg font-semibold text-white mb-2">
							No activity recorded yet
						</h3>
						<p className="text-zinc-400">
							Start managing your inventory to see activity logs.
						</p>
					</div>
				</div>
			)}

			{/* Timeline */}
			{!isLoading && !isEmpty && (
				<div className="max-w-3xl mx-auto">
					<div className="space-y-6">
						{logs.map((log, idx) => {
							const colors =
								ENTITY_COLORS[log.entityType] ||
								ENTITY_COLORS.Product;
							const Icon =
								ENTITY_ICONS[log.entityType] || Package;
							const isLast = idx === logs.length - 1;

							return (
								<motion.div
									key={log._id}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: idx * 0.05 }}
									className="relative"
								>
									{/* Timeline dot and line */}
									<div className="absolute left-0 top-0 w-12 flex justify-center">
										<div className="relative flex flex-col items-center">
											<div
												className={`w-6 h-6 rounded-full ${colors.dot} border-4 border-[#0a0d12] flex items-center justify-center`}
											>
												<Icon className="w-3 h-3 text-white" />
											</div>
											{!isLast && (
												<div
													className={`w-1 h-24 ${colors.dot} opacity-30 mt-2`}
												/>
											)}
										</div>
									</div>

									{/* Content */}
									<div className="ml-20 bg-[#13161F] border border-white/10 rounded-xl p-5 backdrop-blur">
										<div className="flex items-start justify-between gap-4 mb-3">
											<div>
												<p className="text-sm text-zinc-400">
													{formatTime(log.createdAt)}{" "}
													·{" "}
													{formatDate(log.createdAt)}
												</p>
												<p className="text-white font-semibold mt-1">
													{log.description}
												</p>
												<p className="text-xs text-zinc-400 mt-2">
													by{" "}
													<span className="text-zinc-300">
														{log.performedBy
															?.name || "System"}
													</span>
												</p>
											</div>
											<span
												className={`px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${colors.bg} ${colors.text}`}
											>
												{log.entityType}
											</span>
										</div>
									</div>
								</motion.div>
							);
						})}
					</div>

					{/* Pagination */}
					<div className="flex items-center justify-between px-4 py-6 mt-8 border-t border-white/10">
						<div className="text-sm text-zinc-400">
							Showing {(page - 1) * LIMIT + 1}–
							{Math.min(page * LIMIT, total)} of {total} entries
						</div>
						<div className="flex gap-2">
							<button
								onClick={() => setPage(Math.max(1, page - 1))}
								disabled={page === 1}
								className="p-2 rounded hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								←
							</button>
							{Array.from({ length: totalPages }).map((_, i) => {
								const pageNum = i + 1;
								return (
									<button
										key={pageNum}
										onClick={() => setPage(pageNum)}
										className={`px-3 py-1 rounded text-sm ${
											page === pageNum
												? "bg-indigo-600 text-white"
												: "hover:bg-white/10 text-zinc-400"
										}`}
									>
										{pageNum}
									</button>
								);
							})}
							<button
								onClick={() =>
									setPage(Math.min(totalPages, page + 1))
								}
								disabled={page === totalPages}
								className="p-2 rounded hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								→
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
