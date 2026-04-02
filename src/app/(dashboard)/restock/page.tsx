"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowUp, Trash2, AlertTriangle, CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { SkeletonGrid } from "@/components/shared/Skeleton";
import { restockApi, RestockQueueItem } from "@/lib/restockApi";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import {
	RestockModal,
	RemoveConfirmDialog,
} from "@/components/restock/RestockModals";

const PRIORITY_COLORS: Record<string, string> = {
	High: "bg-red-500/20 text-red-400 border-red-500/30",
	Medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
	Low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const PRIORITY_ICONS: Record<string, string> = {
	High: "🔴",
	Medium: "🟡",
	Low: "🔵",
};

export default function RestockPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const queryClient = useQueryClient();

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

	const LIMIT = 10;

	// Update URL
	const updateUrl = (newPriority: string, newPage: number) => {
		const params = new URLSearchParams();
		if (newPriority) params.set("priority", newPriority);
		if (newPage > 1) params.set("page", newPage.toString());
		router.push(`/restock?${params.toString()}`);
	};

	// Fetch restock queue
	const { data: queueData, isLoading } = useQuery({
		queryKey: ["restock", { priorityFilter, page }],
		queryFn: () =>
			restockApi.getRestockQueue({
				priority: priorityFilter || undefined,
				page,
				limit: LIMIT,
			}),
	});

	// Mutations
	const resolveMutation = useMutation({
		mutationFn: ({ id, quantity }: any) =>
			restockApi.resolveRestockItem(id, { quantity }),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["restock"] });
			queryClient.invalidateQueries({ queryKey: ["products"] });
			queryClient.invalidateQueries({ queryKey: ["restock-count"] });
			setRestockModalOpen(false);
			const product = data.queueItem?.product || {};
			toast.success(
				`${product.name} restocked! Stock updated successfully.`,
			);
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const removeMutation = useMutation({
		mutationFn: (id: string) => restockApi.removeFromQueue(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["restock"] });
			queryClient.invalidateQueries({ queryKey: ["restock-count"] });
			setRemoveConfirmOpen(false);
			toast.success("Item removed from queue");
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	// Get priority counts
	const priorityCounts = useMemo(() => {
		const counts = { High: 0, Medium: 0, Low: 0 };
		if (queueData?.data) {
			queueData.data.forEach((item) => {
				if (!item.isResolved) {
					counts[item.priority]++;
				}
			});
		}
		return counts;
	}, [queueData?.data]);

	// Data
	const items = queueData?.data || [];
	const total = queueData?.total || 0;
	const totalPages = queueData?.totalPages || 1;
	const isEmpty = items.length === 0 && !isLoading;

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

	const getStockPercentage = (current: number, threshold: number) => {
		return Math.min((current / threshold) * 100, 100);
	};

	const getProgressBarColor = (percentage: number) => {
		if (percentage <= 30) return "bg-red-500";
		if (percentage <= 60) return "bg-amber-500";
		return "bg-yellow-500";
	};

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
			resolveMutation.mutateAsync({ id: selectedItem._id, quantity });
		}
	};

	const handleRemoveConfirm = async () => {
		if (selectedItem) {
			await removeMutation.mutateAsync(selectedItem._id);
			setSelectedItem(null);
		}
	};

	return (
		<>
			<PageHeader
				title="Restock Queue"
				subtitle="Products running low on stock"
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
			<div className="flex gap-3 mb-6 border-b border-white/10 pb-4 flex-wrap">
				<button
					onClick={() => {
						setPriorityFilter("");
						setPage(1);
						updateUrl("", 1);
					}}
					className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
						priorityFilter === ""
							? "text-indigo-400 border-b-2 border-indigo-400"
							: "text-zinc-400 hover:text-zinc-300"
					}`}
				>
					All
				</button>

				{["High", "Medium", "Low"].map((priority) => (
					<button
						key={priority}
						onClick={() => {
							setPriorityFilter(priority);
							setPage(1);
							updateUrl(priority, 1);
						}}
						className={`px-4 py-2 rounded-t-lg font-medium transition-colors flex items-center gap-2 ${
							priorityFilter === priority
								? "text-indigo-400 border-b-2 border-indigo-400"
								: "text-zinc-400 hover:text-zinc-300"
						}`}
					>
						{PRIORITY_ICONS[priority]} {priority}
						{priorityCounts[priority] > 0 && (
							<span className="text-xs bg-white/10 px-2 py-1 rounded-full">
								{priorityCounts[priority]}
							</span>
						)}
					</button>
				))}
			</div>

			{/* Loading State */}
			{isLoading && <SkeletonGrid count={10} variant="row" />}

			{/* Empty State */}
			{isEmpty && (
				<div className="flex flex-col items-center justify-center py-16 px-4">
					<div className="text-center">
						<CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
						<h3 className="text-lg font-semibold text-white mb-2">
							All stocked up!
						</h3>
						<p className="text-zinc-400">
							No products are below their minimum threshold.
						</p>
					</div>
				</div>
			)}

			{/* Restock Queue Table */}
			{!isEmpty && (
				<div className="bg-[#13161F] border border-white/10 rounded-xl overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
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
								<AnimatePresence>
									{items.map((item) => {
										const percentage = getStockPercentage(
											item.currentStock,
											item.product.minStockThreshold,
										);
										const barColor =
											getProgressBarColor(percentage);

										return (
											<motion.tr
												key={item._id}
												initial={{ opacity: 0, x: -20 }}
												animate={{ opacity: 1, x: 0 }}
												exit={{ opacity: 0, x: -20 }}
												className="border-b border-white/5 hover:bg-white/5"
											>
												<td className="px-4 py-3 text-white font-medium">
													{item.product.name}
												</td>
												<td className="px-4 py-3 text-zinc-400">
													{item.product.category ||
														"—"}
												</td>
												<td className="px-4 py-3">
													<div className="space-y-2">
														<p className="text-red-400 font-bold text-lg">
															{item.currentStock}
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
														className={`px-2.5 py-1 rounded-full text-xs font-medium border flex w-fit items-center gap-1 ${
															PRIORITY_COLORS[
																item.priority
															]
														}`}
													>
														{
															PRIORITY_ICONS[
																item.priority
															]
														}{" "}
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
													</div>
												</td>
											</motion.tr>
										);
									})}
								</AnimatePresence>
							</tbody>
						</table>
					</div>

					{/* Pagination */}
					<div className="flex items-center justify-between px-4 py-4 border-t border-white/10">
						<div className="text-sm text-zinc-400">
							Showing {(page - 1) * LIMIT + 1}–
							{Math.min(page * LIMIT, total)} of {total} items
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

			{/* Remove Confirm Dialog */}
			{selectedItem && (
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
