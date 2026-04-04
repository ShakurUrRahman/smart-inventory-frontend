"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Plus, Eye, ChevronDown, X, Calendar } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkeletonGrid } from "@/components/shared/Skeleton";
import { ordersApi, Order } from "@/lib/ordersApi";
import { categoriesApi } from "@/lib/categoriesApi";
import { productsApi } from "@/lib/productsApi";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import CreateOrderDrawer from "@/components/orders/CreateOrderDrawer";
import {
	StatusConfirmDialog,
	StatusDropdown,
} from "@/components/orders/StatusDropdown";
import { useDebounce } from "@/hooks/useSearch";

const STATUS_OPTIONS = [
	"Pending",
	"Confirmed",
	"Shipped",
	"Delivered",
	"Cancelled",
];

const STATUS_COLORS: Record<string, string> = {
	Pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
	Confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
	Shipped: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
	Delivered: "bg-green-500/20 text-green-400 border-green-500/30",
	Cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function OrdersPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const queryClient = useQueryClient();

	const [search, setSearch] = useState(searchParams.get("search") || "");
	const [statusFilter, setStatusFilter] = useState(
		searchParams.get("status") || "",
	);
	const [dateFilter, setDateFilter] = useState(
		searchParams.get("date") || "",
	);
	const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
	const debouncedSearch = useDebounce(search, 400);
	const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
	const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
	const [statusConfirmDialog, setStatusConfirmDialog] = useState<{
		orderId: string;
		orderNumber: string;
		currentStatus: string;
		newStatus: string;
	} | null>(null);

	const LIMIT = 10;

	const updateUrl = (
		newSearch: string,
		newStatus: string,
		newDate: string,
		newPage: number,
	) => {
		const params = new URLSearchParams();
		if (newSearch) params.set("search", newSearch);
		if (newStatus) params.set("status", newStatus);
		if (newDate) params.set("date", newDate);
		if (newPage > 1) params.set("page", newPage.toString());
		router.push(`/orders?${params.toString()}`);
	};

	const handleSearchChange = (value: string) => setSearch(value);

	const { data: ordersData, isLoading: ordersLoading } = useQuery({
		queryKey: [
			"orders",
			{ search: debouncedSearch, statusFilter, dateFilter, page },
		],
		queryFn: () =>
			ordersApi.getAllOrders({
				search: debouncedSearch || undefined,
				status: statusFilter || undefined,
				date: dateFilter || undefined,
				page,
				limit: LIMIT,
			}),
		staleTime: 30000,
		gcTime: 60000,
	});

	const { data: products = [] } = useQuery({
		queryKey: ["products-all"],
		queryFn: () => productsApi.getAllProducts({ limit: 1000 }),
		select: (data) => data.data || [],
		staleTime: 60000,
	});

	const { data: categories = [] } = useQuery({
		queryKey: ["categories"],
		queryFn: categoriesApi.getAllCategories,
		staleTime: 60000,
	});

	const createOrderMutation = useMutation({
		mutationFn: (payload: any) => ordersApi.createOrder(payload),
		onSuccess: (order) => {
			queryClient.invalidateQueries({ queryKey: ["orders"] });
			setCreateDrawerOpen(false);
			toast.success(`Order ${order.orderNumber} created!`);
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const updateStatusMutation = useMutation({
		mutationFn: ({ orderId, status }: any) =>
			ordersApi.updateOrderStatus(orderId, { status }),
		onSuccess: (order) => {
			queryClient.invalidateQueries({ queryKey: ["orders"] });
			setStatusConfirmDialog(null);
			toast.success(
				`Order ${order.orderNumber} marked as ${order.status}!`,
			);
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const statusCounts = useMemo(() => {
		const counts: Record<string, number> = {
			Pending: 0,
			Confirmed: 0,
			Shipped: 0,
			Delivered: 0,
			Cancelled: 0,
		};
		if (ordersData?.data) {
			ordersData.data.forEach((order) => {
				counts[order.status]++;
			});
		}
		return counts;
	}, [ordersData?.data]);

	const orders = ordersData?.data || [];
	const total = ordersData?.total || 0;
	const totalPages = ordersData?.totalPages || 1;
	const isEmpty = orders.length === 0 && !ordersLoading;
	const hasActiveFilters = search || statusFilter || dateFilter;

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const formatPrice = (price: number) =>
		new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
		}).format(price);

	const ExpandedOrderDetail = ({ order }: { order: Order }) => (
		<div className="px-4 py-4 space-y-3 text-sm">
			<div className="grid grid-cols-2 gap-4">
				<div>
					<p className="text-zinc-400 text-xs">Customer</p>
					<p className="text-white font-medium">
						{order.customerName}
					</p>
				</div>
				<div>
					<p className="text-zinc-400 text-xs">Created by</p>
					<p className="text-white font-medium">
						{order.createdBy?.name || "Unknown"}
					</p>
				</div>
			</div>
			<div className="border-t border-white/10 pt-3">
				<p className="text-zinc-400 text-xs mb-2">Items</p>
				<div className="space-y-2">
					{order.items.map((item, idx) => (
						<div
							key={idx}
							className="flex justify-between items-center bg-black/20 p-2 rounded"
						>
							<div>
								<p className="text-white">
									{item.productName} ×{item.quantity}
								</p>
								<p className="text-zinc-400 text-xs">
									${item.unitPrice.toFixed(2)} each
								</p>
							</div>
							<p className="text-white font-semibold">
								{formatPrice(item.subtotal)}
							</p>
						</div>
					))}
				</div>
			</div>
			<div className="border-t border-white/10 pt-3 text-right">
				<p className="text-zinc-400 text-xs">Total</p>
				<p className="text-2xl font-bold text-white">
					{formatPrice(order.totalPrice)}
				</p>
			</div>
		</div>
	);

	const OrderActions = ({ order }: { order: Order }) => (
		<div className="flex items-center gap-2">
			<button
				onClick={() =>
					setExpandedOrderId(
						expandedOrderId === order._id ? null : order._id,
					)
				}
				className={`p-1.5 rounded hover:bg-blue-500/20 text-blue-400 transition ${
					expandedOrderId === order._id ? "bg-blue-500/20" : ""
				}`}
				title="View"
			>
				<Eye className="w-4 h-4" />
			</button>

			{!["Delivered", "Cancelled"].includes(order.status) ? (
				<StatusDropdown
					order={order}
					onStatusChange={(newStatus) => {
						setStatusConfirmDialog({
							orderId: order._id,
							orderNumber: order.orderNumber,
							currentStatus: order.status,
							newStatus,
						});
					}}
				/>
			) : (
				<button
					disabled
					className="p-1.5 text-zinc-600 cursor-not-allowed"
				>
					<ChevronDown className="w-4 h-4" />
				</button>
			)}
		</div>
	);

	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
		>
			<PageHeader
				title="Orders"
				subtitle={`${total} total order${total !== 1 ? "s" : ""}`}
				action={
					<Button
						onClick={() => setCreateDrawerOpen(true)}
						className="bg-indigo-600 hover:bg-indigo-500 gap-2"
					>
						<Plus className="w-4 h-4" />
						<span className="hidden sm:inline">Create Order</span>
					</Button>
				}
			/>

			{/* Status Filter Tabs */}
			<div className="flex gap-2 sm:gap-3 mb-6 border-b border-white/10 pb-2 overflow-x-auto whitespace-nowrap">
				<button
					onClick={() => {
						setStatusFilter("");
						setPage(1);
						updateUrl(search, "", dateFilter, 1);
					}}
					className={`flex-shrink-0 px-3 sm:px-4 py-2 text-sm rounded-t-lg font-medium transition-all ${
						statusFilter === ""
							? "text-indigo-400 border-b-2 border-indigo-400"
							: "text-zinc-400 hover:text-zinc-300"
					}`}
				>
					All
				</button>
				{STATUS_OPTIONS.map((status) => (
					<button
						key={status}
						onClick={() => {
							setStatusFilter(status);
							setPage(1);
							updateUrl(search, status, dateFilter, 1);
						}}
						className={`flex-shrink-0 px-3 sm:px-4 py-2 text-sm rounded-t-lg font-medium transition-all flex items-center gap-2 ${
							statusFilter === status
								? "text-indigo-400 border-b-2 border-indigo-400"
								: "text-zinc-400 hover:text-zinc-300"
						}`}
					>
						{status}
						{statusCounts[status] > 0 && (
							<span className="text-xs bg-white/10 px-1.5 py-0.5 rounded-full">
								{statusCounts[status]}
							</span>
						)}
					</button>
				))}
			</div>

			{/* Filter Bar */}
			<div className="bg-[#13161F] border border-white/10 rounded-xl p-4 mb-6 space-y-3">
				<div className="flex gap-3 flex-wrap">
					<div className="relative flex-1 min-w-[200px]">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
						<Input
							placeholder="Search by customer name..."
							value={search}
							onChange={(e) => handleSearchChange(e.target.value)}
							className="pl-10 bg-[#1C1F2A] border-zinc-700/60"
						/>
					</div>
					<div className="relative">
						<Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
						<input
							type="date"
							value={dateFilter}
							onChange={(e) => {
								setDateFilter(e.target.value);
								setPage(1);
								updateUrl(
									search,
									statusFilter,
									e.target.value,
									1,
								);
							}}
							className="pl-10 px-3 py-2 rounded-lg bg-[#1C1F2A] border border-zinc-700/60 text-white text-sm focus:border-indigo-500 focus:outline-none"
						/>
					</div>
				</div>
				{hasActiveFilters && (
					<button
						onClick={() => {
							setSearch("");
							setStatusFilter("");
							setDateFilter("");
							setPage(1);
							updateUrl("", "", "", 1);
						}}
						className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
					>
						<X className="w-3 h-3" /> Clear Filters
					</button>
				)}
			</div>

			{/* Empty State */}
			{isEmpty && (
				<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
					<div className="text-5xl mb-4">📋</div>
					<h3 className="text-lg font-semibold text-white mb-2">
						{hasActiveFilters
							? "No orders match your filters"
							: "No orders yet"}
					</h3>
					<p className="text-zinc-400 mb-6">
						{hasActiveFilters
							? "Try adjusting your filters"
							: "Create your first order to get started"}
					</p>
					{hasActiveFilters ? (
						<Button
							onClick={() => {
								setSearch("");
								setStatusFilter("");
								setDateFilter("");
								setPage(1);
								updateUrl("", "", "", 1);
							}}
							className="bg-indigo-600 hover:bg-indigo-500"
						>
							Clear Filters
						</Button>
					) : (
						<Button
							onClick={() => setCreateDrawerOpen(true)}
							className="bg-indigo-600 hover:bg-indigo-500 gap-2"
						>
							<Plus className="w-4 h-4" /> Create First Order
						</Button>
					)}
				</div>
			)}

			{/* Orders */}
			{(!isEmpty || ordersLoading) && (
				<div className="rounded-xl overflow-hidden">
					{/* ── MOBILE VIEW ── */}
					<div className="block lg:hidden space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
						{ordersLoading ? (
							<SkeletonGrid count={5} variant="row" />
						) : (
							orders.map((order) => (
								<div key={order._id}>
									<div className="bg-[#13161F] border border-white/10 rounded-xl p-4 space-y-3">
										<div className="flex justify-between items-center">
											<p className="font-bold text-white font-mono text-sm">
												#{order.orderNumber}
											</p>
											<span
												className={`px-2 py-1 text-xs rounded-full border ${STATUS_COLORS[order.status]}`}
											>
												{order.status}
											</span>
										</div>
										<p className="text-sm text-zinc-300">
											{order.customerName}
										</p>
										<div className="flex justify-between items-center">
											<p className="text-xs text-zinc-400">
												{order.items.length} item
												{order.items.length !== 1
													? "s"
													: ""}
											</p>
											<p className="text-white font-semibold">
												{formatPrice(order.totalPrice)}
											</p>
										</div>
										<div className="flex justify-between items-center">
											<p className="text-xs text-zinc-500">
												{formatDate(order.createdAt)}
											</p>
											<OrderActions order={order} />
										</div>
									</div>

									{/* Mobile Expanded */}
									<AnimatePresence>
										{expandedOrderId === order._id && (
											<motion.div
												initial={{
													height: 0,
													opacity: 0,
												}}
												animate={{
													height: "auto",
													opacity: 1,
												}}
												exit={{ height: 0, opacity: 0 }}
												transition={{ duration: 0.3 }}
												className="overflow-hidden bg-white/5 border border-white/10 border-t-0 rounded-b-xl"
											>
												<ExpandedOrderDetail
													order={order}
												/>
											</motion.div>
										)}
									</AnimatePresence>
								</div>
							))
						)}
					</div>

					{/* ── DESKTOP VIEW ── */}
					<div className="hidden lg:block bg-[#13161F] border border-white/10 rounded-xl overflow-hidden">
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-white/10 bg-black/20">
										<th className="px-4 py-3 text-left font-semibold text-zinc-300 w-32">
											Order #
										</th>
										<th className="px-4 py-3 text-left font-semibold text-zinc-300">
											Customer
										</th>
										<th className="px-4 py-3 text-left font-semibold text-zinc-300">
											Items
										</th>
										<th className="px-4 py-3 text-left font-semibold text-zinc-300">
											Total
										</th>
										<th className="px-4 py-3 text-left font-semibold text-zinc-300">
											Status
										</th>
										<th className="px-4 py-3 text-left font-semibold text-zinc-300">
											Date
										</th>
										<th className="px-4 py-3 text-left font-semibold text-zinc-300">
											Actions
										</th>
									</tr>
								</thead>
								<tbody>
									{ordersLoading
										? Array.from({ length: 8 }).map(
												(_, i) => (
													<tr
														key={i}
														className="border-b border-white/5"
													>
														<td className="px-4 py-3">
															<div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
														</td>
														<td className="px-4 py-3">
															<div className="h-4 w-40 bg-white/10 rounded animate-pulse" />
														</td>
														<td className="px-4 py-3">
															<div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
														</td>
														<td className="px-4 py-3">
															<div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
														</td>
														<td className="px-4 py-3">
															<div className="h-6 w-20 bg-white/10 rounded-full animate-pulse" />
														</td>
														<td className="px-4 py-3">
															<div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
														</td>
														<td className="px-4 py-3">
															<div className="h-8 w-16 bg-white/10 rounded animate-pulse" />
														</td>
													</tr>
												),
											)
										: orders.map((order) => (
												<React.Fragment key={order._id}>
													<tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
														<td className="px-4 py-3 text-white font-mono font-bold">
															{order.orderNumber}
														</td>
														<td className="px-4 py-3 text-white font-medium">
															{order.customerName}
														</td>
														<td className="px-4 py-3 text-zinc-400">
															{order.items.length}{" "}
															item
															{order.items
																.length !== 1
																? "s"
																: ""}
														</td>
														<td className="px-4 py-3 text-white font-semibold">
															{formatPrice(
																order.totalPrice,
															)}
														</td>
														<td className="px-4 py-3">
															<span
																className={`px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[order.status] || STATUS_COLORS["Cancelled"]}`}
															>
																{order.status}
															</span>
														</td>
														<td className="px-4 py-3 text-zinc-400 text-xs">
															{formatDate(
																order.createdAt,
															)}
														</td>
														<td className="px-4 py-3">
															<OrderActions
																order={order}
															/>
														</td>
													</tr>

													{/* Desktop Expanded Row */}
													<AnimatePresence>
														{expandedOrderId ===
															order._id && (
															<tr
																key={`${order._id}-expanded`}
															>
																<td
																	colSpan={7}
																	className="p-0"
																>
																	<motion.div
																		initial={{
																			height: 0,
																			opacity: 0,
																		}}
																		animate={{
																			height: "auto",
																			opacity: 1,
																		}}
																		exit={{
																			height: 0,
																			opacity: 0,
																		}}
																		transition={{
																			duration: 0.3,
																		}}
																		className="overflow-hidden bg-white/5 border-b border-white/5"
																	>
																		<ExpandedOrderDetail
																			order={
																				order
																			}
																		/>
																	</motion.div>
																</td>
															</tr>
														)}
													</AnimatePresence>
												</React.Fragment>
											))}
								</tbody>
							</table>
						</div>

						{/* Pagination */}
						{!ordersLoading && (
							<div className="flex flex-col sm:flex-row items-center justify-between px-4 py-4 border-t border-white/10 gap-3">
								<div className="text-sm text-zinc-400">
									Showing {(page - 1) * LIMIT + 1}–
									{Math.min(page * LIMIT, total)} of {total}{" "}
									orders
								</div>
								<div className="flex items-center gap-1.5">
									<button
										onClick={() =>
											setPage(Math.max(1, page - 1))
										}
										disabled={page === 1}
										className="p-2 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
									>
										←
									</button>
									{Array.from({ length: totalPages }).map(
										(_, i) => {
											const pageNum = i + 1;
											const isFirstOrLast =
												pageNum === 1 ||
												pageNum === totalPages;
											const isNeighbor =
												Math.abs(pageNum - page) <= 1;
											if (!isFirstOrLast && !isNeighbor) {
												if (
													pageNum === 2 ||
													pageNum === totalPages - 1
												) {
													return (
														<span
															key={`dots-${pageNum}`}
															className="px-1 text-zinc-600"
														>
															...
														</span>
													);
												}
												return null;
											}
											return (
												<button
													key={pageNum}
													onClick={() =>
														setPage(pageNum)
													}
													className={`min-w-[32px] h-8 flex items-center justify-center rounded text-sm transition-all ${
														page === pageNum
															? "bg-indigo-600 text-white"
															: "hover:bg-white/10 text-zinc-400"
													}`}
												>
													{pageNum}
												</button>
											);
										},
									)}
									<button
										onClick={() =>
											setPage(
												Math.min(totalPages, page + 1),
											)
										}
										disabled={page === totalPages}
										className="p-2 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
									>
										→
									</button>
								</div>
							</div>
						)}
					</div>

					{/* Mobile Pagination */}
					{!ordersLoading && (
						<div className="flex lg:hidden items-center justify-between px-2 py-4 mt-2">
							<div className="text-xs text-zinc-400">
								{(page - 1) * LIMIT + 1}–
								{Math.min(page * LIMIT, total)} of {total}
							</div>
							<div className="flex items-center gap-1">
								<button
									onClick={() =>
										setPage(Math.max(1, page - 1))
									}
									disabled={page === 1}
									className="p-2 rounded hover:bg-white/10 disabled:opacity-30"
								>
									←
								</button>
								<span className="text-sm text-zinc-400 px-2">
									{page} / {totalPages}
								</span>
								<button
									onClick={() =>
										setPage(Math.min(totalPages, page + 1))
									}
									disabled={page === totalPages}
									className="p-2 rounded hover:bg-white/10 disabled:opacity-30"
								>
									→
								</button>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Create Order Drawer */}
			<CreateOrderDrawer
				open={createDrawerOpen}
				onOpenChange={setCreateDrawerOpen}
				products={products}
				categories={categories}
				onSubmit={(payload) => createOrderMutation.mutateAsync(payload)}
				isLoading={createOrderMutation.isPending}
			/>

			{/* Status Confirm Dialog */}
			{statusConfirmDialog && (
				<StatusConfirmDialog
					open={!!statusConfirmDialog}
					onOpenChange={(open) =>
						!open && setStatusConfirmDialog(null)
					}
					orderNumber={statusConfirmDialog.orderNumber}
					newStatus={statusConfirmDialog.newStatus}
					onConfirm={() =>
						updateStatusMutation.mutateAsync({
							orderId: statusConfirmDialog.orderId,
							status: statusConfirmDialog.newStatus,
						})
					}
					isLoading={updateStatusMutation.isPending}
				/>
			)}
		</motion.div>
	);
}
