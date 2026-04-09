"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
	Clock,
	Lock,
	ShieldPlus,
	ShieldMinus,
	UserMinus,
	UserCheck,
	Search,
	CheckCircle,
	Loader2,
	ChevronDown,
	ChevronUp,
	Package,
	Tag,
	Users,
	AlertTriangle,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import {
	getUsers,
	promoteToManager,
	promoteToAdmin,
	demoteAdminToManager,
	demoteManagerToUser,
	updateCategoryPermissions,
	getPendingProducts,
	approveProduct,
	rejectProduct,
} from "@/lib/adminApi";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
} from "@/components/ui/sheet";
import { PageHeader } from "@/components/layout/PageHeader";
import {
	Modal,
	ModalFooter,
	ModalHeader,
} from "@/components/shared/DialogModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ROLE_STYLES: Record<
	string,
	{ bg: string; text: string; border: string; icon: string }
> = {
	super_admin: {
		bg: "bg-yellow-500/20",
		text: "text-yellow-400",
		border: "border-yellow-500/30",
		icon: "👑",
	},
	admin: {
		bg: "bg-indigo-500/20",
		text: "text-indigo-400",
		border: "border-indigo-500/30",
		icon: "🛡️",
	},
	manager: {
		bg: "bg-blue-500/20",
		text: "text-blue-400",
		border: "border-blue-500/30",
		icon: "💼",
	},
	user: {
		bg: "bg-zinc-500/20",
		text: "text-zinc-400",
		border: "border-zinc-500/30",
		icon: "👤",
	},
};

const TABS = [
	{ id: "users", label: "User Management", icon: Users },
	{ id: "approvals", label: "Pending Approvals", icon: Package },
];

function RoleBadge({ role }: { role: string }) {
	const s = ROLE_STYLES[role] || ROLE_STYLES.user;
	return (
		<span
			className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${s.bg} ${s.text} ${s.border}`}
		>
			<span>{s.icon}</span>
			{role.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
		</span>
	);
}

function UserAvatar({ name, role }: { name: string; role: string }) {
	const colors: Record<string, string> = {
		super_admin: "bg-yellow-500",
		admin: "bg-indigo-500",
		manager: "bg-blue-500",
		user: "bg-zinc-500",
	};
	const initials = name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
	return (
		<div
			className={`${colors[role] || "bg-zinc-500"} w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
		>
			{initials}
		</div>
	);
}

// ─── User Row ─────────────────────────────────────────────────────────────────
function UserRow({ user, currentUser, onAction, onViewHistory }: any) {
	const [expanded, setExpanded] = useState(false);
	const queryClient = useQueryClient();

	const updatePermsMutation = useMutation({
		mutationFn: ({
			permission,
			value,
		}: {
			permission: string;
			value: boolean;
		}) => updateCategoryPermissions(user._id, { [permission]: value }),

		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: ["admin-users"] });

			const permissionLabels: Record<string, string> = {
				canCreate: "Create",
				canUpdate: "Update",
				canDelete: "Delete",
			};

			// Use 'variables.permission' here
			const label =
				permissionLabels[variables.permission] || variables.permission;
			const status = variables.value ? "enabled" : "disabled";

			toast.success(`${label} permission ${status} for ${user.name}`);
		},
		onError: (error: any) => {
			console.error("Permission update error:", error);
			toast.error(error.message || "Failed to update permissions");
		},
	});

	const canModify = !user.isSuperAdmin;
	const showPromoteManager = user.role === "user";
	const showPromoteAdmin =
		user.role === "manager" && currentUser?.isSuperAdmin;
	const showDemoteManager =
		user.role === "admin" && currentUser?.isSuperAdmin;
	const showDemoteUser =
		user.role === "manager" &&
		(currentUser?.role === "admin" || currentUser?.isSuperAdmin);

	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			className="bg-[#13161F] border border-white/10 rounded-xl overflow-hidden"
		>
			{/* Main Row */}
			<div className="flex items-center gap-3 p-4">
				<UserAvatar name={user.name} role={user.role} />

				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 flex-wrap">
						<p className="text-white font-medium text-sm truncate">
							{user.name}
						</p>
						{user.isSuperAdmin && (
							<Lock className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
						)}
					</div>
					<p className="text-zinc-500 text-xs truncate">
						{user.email}
					</p>
				</div>

				<RoleBadge role={user.role} />

				{canModify && (
					<button
						onClick={() => setExpanded(!expanded)}
						className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 transition flex-shrink-0"
					>
						{expanded ? (
							<ChevronUp className="w-4 h-4" />
						) : (
							<ChevronDown className="w-4 h-4" />
						)}
					</button>
				)}
			</div>

			{/* Expanded Panel */}
			<AnimatePresence>
				{expanded && canModify && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.25 }}
						className="overflow-hidden border-t border-white/5"
					>
						<div className="p-4 space-y-4 bg-black/20">
							{/* Role Actions */}
							<div className="space-y-2">
								<p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">
									Role Actions
								</p>
								<div className="flex flex-wrap gap-2">
									{showPromoteManager && (
										<button
											onClick={() =>
												onAction("make-manager", user)
											}
											className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 text-xs transition"
										>
											<UserCheck className="w-3.5 h-3.5" />{" "}
											Make Manager
										</button>
									)}
									{showPromoteAdmin && (
										<button
											onClick={() =>
												onAction("make-admin", user)
											}
											className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 text-xs transition"
										>
											<ShieldPlus className="w-3.5 h-3.5" />{" "}
											Make Admin
										</button>
									)}
									{showDemoteManager && (
										<button
											onClick={() =>
												onAction("demote-manager", user)
											}
											className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 text-xs transition"
										>
											<ShieldMinus className="w-3.5 h-3.5" />{" "}
											Demote to Manager
										</button>
									)}
									{showDemoteUser && (
										<button
											onClick={() =>
												onAction("demote-user", user)
											}
											className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-xs transition"
										>
											<UserMinus className="w-3.5 h-3.5" />{" "}
											Demote to User
										</button>
									)}
									{user.roleHistory?.length > 0 && (
										<button
											onClick={() => onViewHistory(user)}
											className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10 text-xs transition"
										>
											<Clock className="w-3.5 h-3.5" />{" "}
											View History
										</button>
									)}
								</div>
							</div>

							{user.role === "manager" && (
								<div className="space-y-3">
									<h4 className="text-sm font-semibold text-white">
										Category Permissions
									</h4>
									<div className="grid grid-cols-3 gap-2">
										{[
											{
												key: "canCreate",
												label: "Create",
												icon: "➕",
											},
											{
												key: "canUpdate",
												label: "Update",
												icon: "✏️",
											},
											{
												key: "canDelete",
												label: "Delete",
												icon: "🗑️",
											},
										].map(({ key, label, icon }) => {
											const checked =
												user.categoryPermissions?.[
													key
												] || false;
											const isThisOneUpdating =
												updatePermsMutation.isPending &&
												updatePermsMutation.variables
													?.permission === key;
											return (
												<div
													key={key}
													className="flex flex-col gap-2"
												>
													<label className="text-xs font-medium text-zinc-400">
														{icon} {label}
													</label>

													<button
														onClick={() =>
															updatePermsMutation.mutate(
																{
																	permission:
																		key,
																	value: !checked,
																},
															)
														}
														disabled={
															isThisOneUpdating
														}
														className={`relative px-4 py-1 rounded-lg border-2 font-medium text-sm transition-all ${
															checked
																? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/30"
																: "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
														} disabled:opacity-50 disabled:cursor-not-allowed`}
													>
														{isThisOneUpdating ? (
															<Loader2 className="w-4 h-4 animate-spin mx-auto" />
														) : (
															<span>
																{checked
																	? "ON"
																	: "OFF"}
															</span>
														)}
													</button>
												</div>
											);
										})}
									</div>
								</div>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}

// ─── User Management Tab ──────────────────────────────────────────────────────
function UserManagement({
	currentUser,
	isLoadingUsers,
	users,
	onRoleChange,
}: any) {
	const [roleFilter, setRoleFilter] = useState("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [confirmAction, setConfirmAction] = useState<{
		type: string;
		user: any;
	} | null>(null);
	const [roleHistoryUser, setRoleHistoryUser] = useState<any>(null);
	const queryClient = useQueryClient();

	const promoteMutation = useMutation({
		mutationFn: ({ type, userId }: { type: string; userId: string }) => {
			if (type === "make-manager") return promoteToManager(userId);
			if (type === "make-admin") return promoteToAdmin(userId);
			if (type === "demote-manager") return demoteAdminToManager(userId);
			return demoteManagerToUser(userId);
		},
		onSuccess: (updatedUser: any, variables) => {
			queryClient.invalidateQueries({ queryKey: ["admin-users"] });
			const msgs: Record<string, string> = {
				"make-manager": `${updatedUser?.name || "User"} promoted to Manager 🎉`,
				"make-admin": `${updatedUser?.name || "User"} promoted to Admin 🛡️`,
				"demote-manager": `${updatedUser?.name || "User"} demoted to Manager`,
				"demote-user": `${updatedUser?.name || "User"} demoted to User`,
			};
			toast.success(msgs[variables.type] || "Role updated");
			setConfirmAction(null);
			onRoleChange?.();
		},
		onError: (error: any) => toast.error(error.message),
	});

	const filteredUsers = useMemo(() => {
		return users.filter((user: any) => {
			const matchesRole =
				roleFilter === "all" ||
				(roleFilter === "users" && user.role === "user") ||
				(roleFilter === "managers" && user.role === "manager") ||
				(roleFilter === "admins" &&
					(user.role === "admin" || user.role === "super_admin"));
			const matchesSearch =
				!searchQuery ||
				user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				user.email.toLowerCase().includes(searchQuery.toLowerCase());
			return matchesRole && matchesSearch;
		});
	}, [users, roleFilter, searchQuery]);

	const FILTERS = [
		{ id: "all", label: "All" },
		{ id: "users", label: "Users" },
		{ id: "managers", label: "Managers" },
		{ id: "admins", label: "Admins" },
	];

	return (
		<div className="space-y-4">
			{/* Filter Bar */}
			<div className="flex flex-col sm:flex-row gap-3">
				<div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 overflow-x-auto">
					{FILTERS.map(({ id, label }) => (
						<button
							key={id}
							onClick={() => setRoleFilter(id)}
							className="relative flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
						>
							{roleFilter === id && (
								<motion.div
									layoutId="userFilterBg"
									className="absolute inset-0 bg-indigo-600 rounded-lg"
									transition={{
										type: "spring",
										stiffness: 400,
										damping: 35,
									}}
								/>
							)}
							<span
								className={`relative z-10 ${roleFilter === id ? "text-white" : "text-zinc-400 hover:text-zinc-300"}`}
							>
								{label}
							</span>
						</button>
					))}
				</div>

				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
					<Input
						placeholder="Search by name or email..."
						className="pl-10 bg-[#1C1F2A] border-zinc-700/60 text-white"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
			</div>

			{/* User List */}
			{isLoadingUsers ? (
				<div className="space-y-3">
					{Array.from({ length: 5 }).map((_, i) => (
						<div
							key={i}
							className="bg-[#13161F] border border-white/10 rounded-xl p-4 animate-pulse"
						>
							<div className="flex items-center gap-3">
								<div className="w-9 h-9 rounded-full bg-white/10" />
								<div className="flex-1 space-y-2">
									<div className="h-4 w-32 bg-white/10 rounded" />
									<div className="h-3 w-48 bg-white/10 rounded" />
								</div>
							</div>
						</div>
					))}
				</div>
			) : filteredUsers.length === 0 ? (
				<div className="text-center py-12 text-zinc-500">
					No users found
				</div>
			) : (
				<div className="space-y-2">
					{filteredUsers.map((user: any) => (
						<UserRow
							key={user.id}
							user={user}
							currentUser={currentUser}
							onAction={(type: string, u: any) =>
								setConfirmAction({ type, user: u })
							}
							onViewHistory={setRoleHistoryUser}
						/>
					))}
				</div>
			)}

			{/* Confirm Dialog */}
			<Modal
				open={!!confirmAction}
				onOpenChange={(open) => !open && setConfirmAction(null)}
			>
				<ModalHeader>
					<div className="mb-3">
						{confirmAction?.type === "make-manager" &&
							"Promote to Manager?"}
						{confirmAction?.type === "make-admin" &&
							"Promote to Admin?"}
						{confirmAction?.type === "demote-manager" &&
							"Demote to Manager?"}
						{confirmAction?.type === "demote-user" &&
							"Demote to User?"}
					</div>
					<div className="text-zinc-400">
						{confirmAction?.type === "make-manager" &&
							`${confirmAction.user.name} will gain access to Orders, Restock Queue, and Activity Log.`}
						{confirmAction?.type === "make-admin" &&
							`${confirmAction.user.name} will gain full system access including the Admin Panel.`}
						{confirmAction?.type === "demote-manager" &&
							`${confirmAction.user.name} will lose Admin Panel access and admin privileges.`}
						{confirmAction?.type === "demote-user" &&
							`${confirmAction.user.name} will lose access to Orders, Restock, Activity Log, and category permissions.`}
					</div>
				</ModalHeader>
				<ModalFooter className="flex justify-end gap-2 mt-2">
					<Button
						onClick={() => setConfirmAction(null)}
						className="w-full sm:w-auto bg-slate-600/70 hover:bg-slate-600"
					>
						Cancel
					</Button>
					<Button
						onClick={() =>
							confirmAction &&
							promoteMutation.mutate({
								type: confirmAction.type,
								userId: confirmAction.user.id,
							})
						}
						disabled={promoteMutation.isPending}
						className="bg-indigo-600 hover:bg-indigo-500"
					>
						Confirm
					</Button>
				</ModalFooter>
			</Modal>

			{/* Role History Sheet */}
			<Sheet
				open={!!roleHistoryUser}
				onOpenChange={(open) => !open && setRoleHistoryUser(null)}
			>
				<SheetContent className="bg-[#0a0d12] border-l border-white/10 text-white w-full sm:max-w-md">
					<SheetHeader>
						<SheetTitle className="text-white">
							{roleHistoryUser?.name}&apos;s Role History
						</SheetTitle>
						<SheetDescription className="text-zinc-400">
							All role changes for this user
						</SheetDescription>
					</SheetHeader>
					<div className="mt-6 space-y-4">
						{roleHistoryUser?.roleHistory?.length === 0 ? (
							<p className="text-zinc-500 text-sm">
								No role changes recorded.
							</p>
						) : (
							roleHistoryUser?.roleHistory?.map(
								(entry: any, idx: number) => (
									<div
										key={idx}
										className="pb-4 border-b border-white/5 last:border-b-0"
									>
										<p className="text-xs text-zinc-500">
											{new Date(
												entry.changedAt,
											).toLocaleDateString("en-US", {
												month: "short",
												day: "numeric",
												year: "numeric",
											})}{" "}
											·{" "}
											{new Date(
												entry.changedAt,
											).toLocaleTimeString("en-US", {
												hour: "2-digit",
												minute: "2-digit",
											})}
										</p>
										<p className="text-sm font-medium text-white mt-1">
											{entry.fromRole.toUpperCase()} →{" "}
											{entry.toRole.toUpperCase()}
										</p>
										{entry.changedBy && (
											<p className="text-xs text-zinc-500 mt-0.5">
												Changed by:{" "}
												{entry.changedBy.name}
											</p>
										)}
									</div>
								),
							)
						)}
					</div>
				</SheetContent>
			</Sheet>
		</div>
	);
}

// ─── Pending Approvals Tab ────────────────────────────────────────────────────
function PendingApprovals({ isLoadingProducts, products, totalPending }: any) {
	const [confirmApprove, setConfirmApprove] = useState<any>(null);
	const [rejectDialog, setRejectDialog] = useState<any>(null);
	const [rejectReason, setRejectReason] = useState("");
	const queryClient = useQueryClient();

	console.log(products);

	const approveMutation = useMutation({
		mutationFn: (id: string) => approveProduct(id),
		onSuccess: (_data, id) => {
			queryClient.invalidateQueries({ queryKey: ["pending-products"] });
			queryClient.invalidateQueries({ queryKey: ["products"] });
			toast.success("✅ Product approved and is now live!");
			setConfirmApprove(null);
		},
		onError: (error: any) => toast.error(error.message),
	});

	const rejectMutation = useMutation({
		mutationFn: (id: string) => rejectProduct(id, { reason: rejectReason }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["pending-products"] });
			queryClient.invalidateQueries({ queryKey: ["products"] });
			toast.success("Product rejected. The submitter has been notified.");
			setRejectDialog(null);
			setRejectReason("");
		},
		onError: (error: any) => toast.error(error.message),
	});

	if (!isLoadingProducts && totalPending === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-center">
				<CheckCircle className="w-14 h-14 text-green-400 mb-4" />
				<h3 className="text-lg font-semibold text-white mb-1">
					All caught up!
				</h3>
				<p className="text-zinc-400 text-sm">
					No products are awaiting approval.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{isLoadingProducts ? (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<div
							key={i}
							className="bg-[#13161F] border border-white/10 rounded-xl p-5 animate-pulse h-64"
						/>
					))}
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<AnimatePresence>
						{products.map((product: any) => (
							<motion.div
								key={product._id || product.id}
								initial={{ opacity: 0, scale: 0.97 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.95 }}
								transition={{ duration: 0.2 }}
								className="bg-[#13161F] border border-amber-500/20 rounded-xl p-5 space-y-4"
							>
								{/* Header */}
								<div className="flex justify-between items-start gap-2">
									<h3 className="text-white font-semibold truncate">
										{product.name}
									</h3>
									<span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0">
										<Clock className="w-3 h-3" /> Pending
									</span>
								</div>

								{/* Details */}
								<div className="space-y-1.5 text-sm">
									<div className="flex justify-between">
										<span className="text-zinc-500">
											Category
										</span>
										<span className="text-zinc-300">
											{product.category?.name ||
												product.category}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-zinc-500">
											Price
										</span>
										<span className="text-white font-medium">
											${product.price?.toFixed(2)}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-zinc-500">
											Stock
										</span>
										<span className="text-zinc-300">
											{product.stock} units
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-zinc-500">
											Min Threshold
										</span>
										<span className="text-zinc-300">
											{product.minStockThreshold} units
										</span>
									</div>
								</div>

								{/* Submitted By */}
								{product.createdBy && (
									<div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
										<div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
											{product.createdBy.name
												?.split(" ")
												.map((n: string) => n[0])
												.join("")
												.toUpperCase()
												.slice(0, 2)}
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-white text-sm font-medium truncate">
												{product.createdBy.name}
											</p>
											<p className="text-zinc-500 text-xs capitalize">
												{product.createdBy.role} ·{" "}
												{new Date(
													product.createdAt,
												).toLocaleDateString("en-US", {
													month: "short",
													day: "numeric",
													year: "numeric",
												})}
											</p>
										</div>
									</div>
								)}

								{/* Actions */}
								<div className="flex gap-2">
									<button
										onClick={() =>
											setConfirmApprove(product)
										}
										className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 text-sm font-medium transition"
									>
										<CheckCircle className="w-4 h-4" />{" "}
										Approve
									</button>
									<button
										onClick={() => setRejectDialog(product)}
										className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-sm font-medium transition"
									>
										❌ Reject
									</button>
								</div>
							</motion.div>
						))}
					</AnimatePresence>
				</div>
			)}

			{/* Approve Confirm */}
			<Modal
				open={!!confirmApprove}
				onOpenChange={(open) => !open && setConfirmApprove(null)}
			>
				<ModalHeader>
					<div>Approve &apos;{confirmApprove?.name}&apos;?</div>
					<div className="text-zinc-400">
						This product will become visible to all users
						immediately.
					</div>
				</ModalHeader>
				<ModalFooter className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-2">
					<Button
						onClick={() => setConfirmApprove(null)}
						className="bg-slate-600/70 hover:bg-slate-600 w-full sm:w-auto"
					>
						Cancel
					</Button>
					<Button
						onClick={() =>
							approveMutation.mutate(
								confirmApprove._id || confirmApprove.id,
							)
						}
						disabled={approveMutation.isPending}
						className="bg-green-600 hover:bg-green-500 w-full sm:w-auto"
					>
						{approveMutation.isPending && (
							<Loader2 className="w-4 h-4 mr-2 animate-spin" />
						)}
						Approve
					</Button>
				</ModalFooter>
			</Modal>

			{/* Reject Dialog */}
			<Modal
				open={!!rejectDialog}
				onOpenChange={(open) => {
					if (!open) {
						setRejectDialog(null);
						setRejectReason("");
					}
				}}
				className="px-3"
			>
				<ModalHeader className="pb-4 border-b border-white/5">
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-full bg-red-500/10 border border-red-500/20">
							<AlertTriangle className="w-5 h-5 text-red-500" />
						</div>
						<div>
							<h3 className="text-lg font-semibold text-white">
								Reject Product
							</h3>
							<p className="text-sm text-zinc-400 font-normal">
								Refusing:{" "}
								<span className="text-zinc-200">
									{rejectDialog?.name}
								</span>
							</p>
						</div>
					</div>
				</ModalHeader>

				<div className="py-6 space-y-3">
					{/* Corrected Layout: Label has its own row */}
					<label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
						Reason for rejection
					</label>

					<Textarea
						placeholder="Why is this product being rejected? Please provide specific details..."
						value={rejectReason}
						onChange={(e) => setRejectReason(e.target.value)}
						className="bg-black/20 border-white/50 text-white placeholder:text-white/30 focus:border-red-500/50 focus:ring-red-500/20 transition-all resize-none"
						rows={4}
					/>

					{/* Corrected Layout: Counter is moved below the Textarea */}
					<div className="flex justify-end pt-1">
						<span
							className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
								rejectReason.length < 10
									? "text-zinc-500 border-white/5 bg-white/2"
									: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
							}`}
						>
							{rejectReason.length} / 10 min
						</span>
					</div>
				</div>

				<ModalFooter className="flex-col-reverse sm:flex-row gap-3 pt-4 ">
					<Button
						onClick={() => {
							setRejectDialog(null);
							setRejectReason("");
						}}
						className="bg-slate-600/70 hover:bg-slate-600 w-full sm:w-auto"
					>
						Cancel
					</Button>

					<Button
						onClick={() =>
							rejectMutation.mutate(
								rejectDialog._id || rejectDialog.id,
							)
						}
						disabled={
							rejectReason.length < 10 || rejectMutation.isPending
						}
						className="w-full sm:w-auto bg-rose-600/70 hover:bg-rose-600-600 disabled:bg-rose-600/40 disabled:cursor-not-allowed"
					>
						{rejectMutation.isPending ? (
							<>
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								Processing...
							</>
						) : (
							"Confirm Rejection"
						)}
					</Button>
				</ModalFooter>
			</Modal>
		</div>
	);
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminPanel() {
	const { user: currentUser } = useAuthStore();
	const queryClient = useQueryClient();
	const [activeTab, setActiveTab] = useState("users");

	const { data: usersData, isLoading: isLoadingUsers } = useQuery({
		queryKey: ["admin-users"],
		queryFn: () => getUsers({ page: 1, limit: 100 }),
		enabled: !!currentUser,
	});

	const { data: productsData, isLoading: isLoadingProducts } = useQuery({
		queryKey: ["pending-products"],
		queryFn: getPendingProducts,
		refetchInterval: 30000,
		enabled: !!currentUser,
	});

	const isSuperAdmin = currentUser?.isSuperAdmin;
	const isAdmin = currentUser?.role === "admin" || currentUser?.isSuperAdmin;
	const pendingCount = productsData?.total || 0;

	if (!isAdmin) {
		return (
			<div className="flex flex-col items-center justify-center py-24 text-center">
				<AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
				<h1 className="text-xl font-bold text-white mb-2">
					Access Denied
				</h1>
				<p className="text-zinc-400 text-sm">
					You don&apos;t have permission to access this page.
				</p>
			</div>
		);
	}

	return (
		<>
			<PageHeader
				title="Admin Panel"
				subtitle={`${usersData?.total || 0} total users`}
				action={
					<span
						className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
							isSuperAdmin
								? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
								: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
						}`}
					>
						{isSuperAdmin ? "👑 Super Admin" : "🛡️ Admin"}
					</span>
				}
			/>

			{/* Sliding Tabs */}
			<div className="relative mb-6">
				<div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
					{TABS.map(({ id, label, icon: Icon }) => (
						<button
							key={id}
							onClick={() => setActiveTab(id)}
							className="relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors"
						>
							{activeTab === id && (
								<motion.div
									layoutId="adminTabBg"
									className="absolute inset-0 bg-indigo-600 rounded-lg"
									transition={{
										type: "spring",
										stiffness: 400,
										damping: 35,
									}}
								/>
							)}
							<Icon
								className={`relative z-10 w-4 h-4 transition-colors ${activeTab === id ? "text-white" : "text-zinc-400"}`}
							/>
							<span
								className={`relative z-10 transition-colors ${activeTab === id ? "text-white" : "text-zinc-400 hover:text-zinc-300"}`}
							>
								{label}
							</span>
							{id === "approvals" && pendingCount > 0 && (
								<span className="relative z-10 flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">
									{pendingCount}
								</span>
							)}
						</button>
					))}
				</div>
			</div>

			{/* Tab Content */}
			<AnimatePresence mode="wait">
				<motion.div
					key={activeTab}
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -8 }}
					transition={{ duration: 0.2 }}
				>
					{activeTab === "users" && (
						<UserManagement
							currentUser={currentUser}
							isLoadingUsers={isLoadingUsers}
							users={usersData?.users || []}
							totalUsers={usersData?.total || 0}
							onRoleChange={() =>
								queryClient.invalidateQueries({
									queryKey: ["admin-users"],
								})
							}
						/>
					)}
					{activeTab === "approvals" && (
						<PendingApprovals
							isLoadingProducts={isLoadingProducts}
							products={productsData?.data || []}
							totalPending={pendingCount}
						/>
					)}
				</motion.div>
			</AnimatePresence>
		</>
	);
}
