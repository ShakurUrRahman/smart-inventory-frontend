"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowUp, Trash2, AlertTriangle, CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SkeletonGrid } from "@/components/shared/Skeleton";
import { restockApi, RestockQueueItem } from "@/lib/restockApi";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import {
	RestockModal,
	RemoveConfirmDialog,
} from "@/components/restock/RestockModals";

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_ICONS: Record<string, string> = {
	High: "🔴",
	Medium: "🟡",
	Low: "🟢",
};

const LIMIT = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getStockPercentage = (current: number, threshold: number) =>
	Math.min((current / threshold) * 100, 100);

const getProgressBarColor = (percentage: number) => {
	if (percentage <= 30) return "bg-red-500";
	if (percentage <= 65) return "bg-amber-500";
	return "bg-green-500";
};

const getPriorityStyle = (percentage: number) => {
	if (percentage <= 30)
		return {
			badge: "bg-red-500/20 text-red-400 border-red-500/30",
			icon: "🔴",
		};
	if (percentage <= 65)
		return {
			badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",
			icon: "🟡",
		};
	return {
		badge: "bg-green-500/20 text-green-400 border-green-500/30",
		icon: "🟢",
	};
};

const formatRelativeTime = (dateString: string) => {
	const date = new Date(dateString);
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const minutes = Math.floor(diff / 60000);
	const hours = Math.floor(diff / 3600000);
	const days = Math.floor(diff / 86400000);
	if (minutes < 60) return `${minutes}m ago`;
	if (hours < 24) return `${hours}h ago`;
	if (days < 7) return `${days}d ago`;
	return date.toLocaleDateString();
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RestockPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const queryClient = useQueryClient();
	const { user } = useAuthStore();

	const isUser = user?.role === "user";

	// State
	const [priorityFilter, setPriorityFilter] = useState(
		searchParams.get("priority") || "",
	);
	const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));

	// UI State
	const [selectedItem, setSelectedItem] = useState<RestockQueueItem | null>(
		null,
	);
	const [restockModalOpen, setRestockModalOpen] = useState(false);
	const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);

	// Update URL
	const updateUrl = (newPriority: string, newPage: number) => {
		const params = new URLSearchParams();
		if (newPriority) params.set("priority", newPriority);
		if (newPage > 1) params.set("page", newPage.toString());
		router.push(`/restock?${params.toString()}`);
	};

	// ── Fetch filtered data (for table) ───────────────────────────────────────
	const { data: queueData, isLoading } = useQuery({
		queryKey: ["restock", { priorityFilter, page }],
		queryFn: () =>
			restockApi.getRestockQueue({
				priority: priorityFilter || undefined,
				page,
				limit: LIMIT,
			}),
	});

	// ── Fetch all data (for priority counts — unaffected by filter) ───────────
	const { data: allQueueData } = useQuery({
		queryKey: ["restock-all-counts"],
		queryFn: () => restockApi.getRestockQueue({ limit: 1000 }),
		staleTime: 30000, // 30 seconds
	});

	// Data
	const items = queueData?.data || [];
	const total = queueData?.total || 0;
	const totalPages = queueData?.totalPages || 1;
	const isEmpty = items.length === 0 && !isLoading;

	// Priority counts from the unfiltered query
	const priorityCounts = allQueueData?.priorityCounts || {
		All: 0,
		High: 0,
		Medium: 0,
		Low: 0,
	};

	// ── Mutations ─────────────────────────────────────────────────────────────
	const resolveMutation = useMutation({
		mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
			restockApi.resolveRestockItem(id, { quantity }),
		onSuccess: (data: any) => {
			queryClient.invalidateQueries({ queryKey: ["restock"] });
			queryClient.invalidateQueries({ queryKey: ["restock-all-counts"] });
			queryClient.invalidateQueries({ queryKey: ["products"] });
			queryClient.invalidateQueries({ queryKey: ["restock-count"] });
			setRestockModalOpen(false);
			setSelectedItem(null);
			const productName = data?.queueItem?.product?.name || "Product";
			toast.success(`${productName} restocked successfully!`);
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const removeMutation = useMutation({
		mutationFn: (id: string) => restockApi.removeFromQueue(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["restock"] });
			queryClient.invalidateQueries({ queryKey: ["restock-all-counts"] });
			queryClient.invalidateQueries({ queryKey: ["restock-count"] });
			setRemoveConfirmOpen(false);
			setSelectedItem(null);
			toast.success("Item removed from queue");
		},
		onError: (error: Error) => toast.error(error.message),
	});

	// ── Handlers ──────────────────────────────────────────────────────────────
	const handleRestockClick = (item: RestockQueueItem) => {
		setSelectedItem(item);
		setRestockModalOpen(true);
	};

	const handleRemoveClick = (item: RestockQueueItem) => {
		setSelectedItem(item);
		setRemoveConfirmOpen(true);
	};

	const handleResolveRestock = (quantity: number) => {
		if (selectedItem) {
			resolveMutation.mutate({ id: selectedItem._id, quantity });
		}
	};

	const handleRemoveConfirm = async () => {
		if (selectedItem) {
			await removeMutation.mutateAsync(selectedItem._id);
		}
	};

	// ── Render ────────────────────────────────────────────────────────────────
	return (
		<>
			<PageHeader
				title={isUser ? "My Product Restocks" : "Restock Queue"}
				subtitle={
					isUser
						? "Restock alerts for your submitted products"
						: "Products running low on stock"
				}
				action={
					total > 0 && (
						<div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-400 rounded-full border border-red-500/30 text-sm font-medium">
							<AlertTriangle className="w-4 h-4" />
							{total} item{total !== 1 ? "s" : ""} need attention
						</div>
					)
				}
			/>

			{/* Priority Filter Tabs */}
			<div className="relative flex gap-2 sm:gap-3 mb-6 border-b border-white/10 pb-2 overflow-x-auto whitespace-nowrap hide-scrollbar">
				{["All", "High", "Medium", "Low"].map((priority) => {
					const value = priority === "All" ? "" : priority;
					const isActive = priorityFilter === value;

					return (
						<motion.button
							key={priority}
							onClick={() => {
								setPriorityFilter(value);
								setPage(1);
								updateUrl(value, 1);
							}}
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className={`relative px-4 py-2 rounded-t-lg font-medium transition-colors flex items-center gap-2 text-sm sm:text-base ${
								isActive
									? "text-indigo-400"
									: "text-zinc-400 hover:text-zinc-300"
							}`}
						>
							{/* Animated sliding indicator */}
							{isActive && (
								<motion.span
									layoutId="tab-indicator"
									className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-400"
									transition={{
										type: "spring",
										stiffness: 400,
										damping: 30,
									}}
								/>
							)}

							{priority !== "All" && PRIORITY_ICONS[priority]}
							{priority}

							{priorityCounts[
								priority as keyof typeof priorityCounts
							] > 0 && (
								<span className="text-xs bg-white/10 px-2 py-1 rounded-full">
									{
										priorityCounts[
											priority as keyof typeof priorityCounts
										]
									}
								</span>
							)}
						</motion.button>
					);
				})}
			</div>

			{/* Empty State */}
			{isEmpty && (
				<div className="flex flex-col items-center justify-center py-16 px-4">
					<div className="text-center">
						<CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
						<h3 className="text-lg font-semibold text-white mb-2">
							All stocked up!
						</h3>
						<p className="text-zinc-400">
							{isUser
								? "None of your products are below the minimum threshold."
								: "No products are below their minimum threshold."}
						</p>
					</div>
				</div>
			)}

			{/* Table */}
			{(!isEmpty || isLoading) && (
				<div className="lg:bg-[#13161F] lg:border lg:border-white/10 rounded-xl overflow-hidden">
					{/* Mobile Cards */}
					<div className="block lg:hidden space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 p-3 lg:p-0">
						{isLoading ? (
							<SkeletonGrid />
						) : (
							items.map((item) => {
								const percentage = getStockPercentage(
									item.currentStock,
									item.product.minStockThreshold,
								);
								const barColor =
									getProgressBarColor(percentage);
								const priorityStyle =
									getPriorityStyle(percentage);

								return (
									<div
										key={item._id}
										className="bg-[#13161F] border border-white/10 rounded-xl p-4 space-y-3"
									>
										<div className="flex justify-between items-center">
											<p className="text-white font-semibold">
												{item.product.name}
											</p>
											<span
												className={`text-xs px-2 py-1 rounded-full border ${priorityStyle.badge}`}
											>
												{priorityStyle.icon}{" "}
												{item.priority}
											</span>
										</div>

										<p className="text-sm text-zinc-400">
											{item.product.category?.name || "—"}
										</p>

										<div>
											<p className="text-red-400 font-bold text-lg">
												{item.currentStock}
											</p>
											<div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mt-1">
												<div
													className={`h-full ${barColor}`}
													style={{
														width: `${percentage}%`,
													}}
												/>
											</div>
										</div>

										<div className="flex justify-between items-center">
											<p className="text-xs text-zinc-500">
												{formatRelativeTime(
													item.createdAt,
												)}
											</p>
											<div className="flex gap-2">
												<button
													onClick={() =>
														handleRestockClick(item)
													}
													className="p-2 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 transition"
													title="Restock"
												>
													<ArrowUp className="w-4 h-4" />
												</button>
												{/* Only admin/manager can remove */}
												{!isUser && (
													<button
														onClick={() =>
															handleRemoveClick(
																item,
															)
														}
														className="p-2 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
														title="Remove from queue"
													>
														<Trash2 className="w-4 h-4" />
													</button>
												)}
											</div>
										</div>
									</div>
								);
							})
						)}
					</div>

					{/* Desktop Table */}
					<div className="hidden lg:block overflow-x-auto">
						<table className="w-full min-w-full text-sm">
							<thead>
								<tr className="border-b border-white/10 bg-black/20">
									<th className="px-4 py-3 text-left font-semibold text-zinc-300">
										Product
									</th>
									<th className="px-4 py-3 text-left font-semibold text-zinc-300">
										Category
									</th>
									<th className="px-4 py-3 text-left font-semibold text-zinc-300">
										Current Stock
									</th>
									<th className="px-4 py-3 text-left font-semibold text-zinc-300">
										Threshold
									</th>
									<th className="px-4 py-3 text-left font-semibold text-zinc-300">
										Priority
									</th>
									<th className="px-4 py-3 text-left font-semibold text-zinc-300">
										Added
									</th>
									<th className="px-4 py-3 text-left font-semibold text-zinc-300">
										Actions
									</th>
								</tr>
							</thead>
							<tbody>
								{isLoading ? (
									Array.from({ length: 8 }).map((_, i) => (
										<tr
											key={i}
											className="border-b border-white/5"
										>
											{Array.from({ length: 7 }).map(
												(_, j) => (
													<td
														key={j}
														className="px-4 py-3"
													>
														<div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
													</td>
												),
											)}
										</tr>
									))
								) : (
									<AnimatePresence>
										{items.map((item) => {
											const percentage =
												getStockPercentage(
													item.currentStock,
													item.product
														.minStockThreshold,
												);
											const barColor =
												getProgressBarColor(percentage);
											const priorityStyle =
												getPriorityStyle(percentage);

											return (
												<motion.tr
													key={item._id}
													initial={{ opacity: 0 }}
													animate={{ opacity: 1 }}
													exit={{ opacity: 0 }}
													className="border-b border-white/5 hover:bg-white/5"
												>
													<td className="px-4 py-3 text-white font-medium">
														{item.product.name}
													</td>
													<td className="px-4 py-3 text-zinc-400">
														{item.product.category
															?.name || "—"}
													</td>
													<td className="px-4 py-3">
														<div className="space-y-1.5">
															<p className="text-red-400 font-bold text-lg">
																{
																	item.currentStock
																}
															</p>
															<div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
																<div
																	className={`h-full ${barColor} transition-all`}
																	style={{
																		width: `${percentage}%`,
																	}}
																/>
															</div>
														</div>
													</td>
													<td className="px-4 py-3 text-zinc-400">
														{
															item.product
																.minStockThreshold
														}
													</td>
													<td className="px-4 py-3">
														<span
															className={`px-2.5 py-1 rounded-full text-xs font-medium border flex w-fit items-center gap-1 ${priorityStyle.badge}`}
														>
															{priorityStyle.icon}{" "}
															{item.priority}
														</span>
													</td>
													<td className="px-4 py-3 text-zinc-400 text-xs">
														{formatRelativeTime(
															item.createdAt,
														)}
													</td>
													<td className="px-4 py-3">
														<div className="flex items-center gap-2">
															{/* Restock — all roles */}
															<button
																onClick={() =>
																	handleRestockClick(
																		item,
																	)
																}
																className="p-1.5 rounded hover:bg-green-500/20 text-green-400 transition"
																title="Restock"
															>
																<ArrowUp className="w-4 h-4" />
															</button>

															{/* Remove — admin/manager only */}
															{!isUser && (
																<button
																	onClick={() =>
																		handleRemoveClick(
																			item,
																		)
																	}
																	className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition"
																	title="Remove from queue"
																>
																	<Trash2 className="w-4 h-4" />
																</button>
															)}
														</div>
													</td>
												</motion.tr>
											);
										})}
									</AnimatePresence>
								)}
							</tbody>
						</table>
					</div>

					{/* Pagination */}
					{!isLoading && total > LIMIT && (
						<div className="px-4 py-4 border-t border-white/10">
							<div className="flex flex-col sm:flex-row items-center justify-between gap-3">
								<div className="text-xs sm:text-sm text-zinc-400 text-center sm:text-left">
									Showing {(page - 1) * LIMIT + 1}–
									{Math.min(page * LIMIT, total)} of {total}{" "}
									items
								</div>

								<div className="flex items-center gap-2">
									<button
										onClick={() =>
											setPage(Math.max(1, page - 1))
										}
										disabled={page === 1}
										className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
									>
										←
									</button>

									{Array.from({ length: totalPages })
										.slice(
											Math.max(0, page - 3),
											Math.min(totalPages, page + 2),
										)
										.map((_, i) => {
											const pageNum =
												Math.max(1, page - 2) + i;
											return (
												<button
													key={pageNum}
													onClick={() =>
														setPage(pageNum)
													}
													className={`min-w-[36px] px-3 py-1.5 rounded text-sm transition ${
														page === pageNum
															? "bg-indigo-600 text-white"
															: "bg-white/5 hover:bg-white/10 text-zinc-400"
													}`}
												>
													{pageNum}
												</button>
											);
										})}

									<button
										onClick={() =>
											setPage(
												Math.min(totalPages, page + 1),
											)
										}
										disabled={page === totalPages}
										className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
									>
										→
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Restock Modal */}
			{selectedItem && (
				<RestockModal
					open={restockModalOpen}
					onOpenChange={setRestockModalOpen}
					item={selectedItem}
					onSubmit={handleResolveRestock}
					isLoading={resolveMutation.isPending}
				/>
			)}

			{/* Remove Confirm — admin/manager only */}
			{selectedItem && !isUser && (
				<RemoveConfirmDialog
					open={removeConfirmOpen}
					onOpenChange={setRemoveConfirmOpen}
					productName={selectedItem.product.name}
					onConfirm={handleRemoveConfirm}
					isLoading={removeMutation.isPending}
				/>
			)}
		</>
	);
}
