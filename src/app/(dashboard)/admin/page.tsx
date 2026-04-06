"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
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
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
	Clock,
	Lock,
	ShieldPlus,
	ShieldMinus,
	UserPlus,
	UserMinus,
	UserCheck,
	Search,
	CheckCircle,
	Loader2,
	X,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

// ─────────────────────────────────────────────────────────────
// SKELETON LOADERS
// ─────────────────────────────────────────────────────────────

const UserTableSkeleton = () => (
	<>
		{[...Array(5)].map((_, i) => (
			<TableRow key={i}>
				<TableCell className="animate-pulse bg-muted h-12" />
				<TableCell className="animate-pulse bg-muted h-12" />
				<TableCell className="animate-pulse bg-muted h-12" />
				<TableCell className="animate-pulse bg-muted h-12" />
			</TableRow>
		))}
	</>
);

const ApprovalCardSkeleton = () => (
	<div className="rounded-lg border border-border bg-card animate-pulse p-6 h-72" />
);

// ─────────────────────────────────────────────────────────────
// ROLE BADGE COMPONENT
// ─────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
	const styles: Record<
		string,
		{ badge: string; text: string; icon: string }
	> = {
		super_admin: {
			badge: "bg-yellow-100 text-yellow-900 border-yellow-300",
			text: "text-yellow-700",
			icon: "👑",
		},
		admin: {
			badge: "bg-indigo-100 text-indigo-900 border-indigo-300",
			text: "text-indigo-700",
			icon: "🛡️",
		},
		manager: {
			badge: "bg-blue-100 text-blue-900 border-blue-300",
			text: "text-blue-700",
			icon: "💼",
		},
		user: {
			badge: "bg-gray-100 text-gray-900 border-gray-300",
			text: "text-gray-700",
			icon: "👤",
		},
	};

	const style = styles[role] || styles.user;
	const roleLabel = role.replace("_", " ");

	return (
		<Badge variant="outline" className={`${style.badge} border`}>
			<span className="mr-1">{style.icon}</span>
			{roleLabel.charAt(0).toUpperCase() + roleLabel.slice(1)}
		</Badge>
	);
}

// ─────────────────────────────────────────────────────────────
// USER AVATAR COMPONENT
// ─────────────────────────────────────────────────────────────

function UserAvatar({ name, role }: { name: string; role: string }) {
	const roleColors: Record<string, string> = {
		super_admin: "bg-yellow-500",
		admin: "bg-indigo-500",
		manager: "bg-blue-500",
		user: "bg-gray-500",
	};

	const initials = name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	return (
		<div
			className={`${roleColors[role] || "bg-gray-500"} w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold`}
		>
			{initials}
		</div>
	);
}

// ─────────────────────────────────────────────────────────────
// TAB 1: USER MANAGEMENT
// ─────────────────────────────────────────────────────────────

interface UserManagementProps {
	currentUser: any;
	isLoadingUsers: boolean;
	users: any[];
	totalUsers: number;
	onRoleChange?: () => void;
}

function UserManagement({
	currentUser,
	isLoadingUsers,
	users,
	totalUsers,
	onRoleChange,
}: UserManagementProps) {
	const [roleFilter, setRoleFilter] = useState("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedUser, setSelectedUser] = useState<any>(null);
	const [roleHistoryUser, setRoleHistoryUser] = useState<any>(null);
	const [confirmAction, setConfirmAction] = useState<{
		type: string;
		user: any;
	} | null>(null);
	const queryClient = useQueryClient();

	// Mutations
	const promoteToManagerMutation = useMutation({
		mutationFn: (userId: string) => promoteToManager(userId),
		onSuccess: (updatedUser) => {
			queryClient.invalidateQueries({ queryKey: ["admin-users"] });
			toast.success(`${updatedUser.name} promoted to Manager`);
			setConfirmAction(null);
			onRoleChange?.();
		},
		onError: (error: any) => {
			toast.error(error.message);
		},
	});

	const promoteToAdminMutation = useMutation({
		mutationFn: (userId: string) => promoteToAdmin(userId),
		onSuccess: (updatedUser) => {
			queryClient.invalidateQueries({ queryKey: ["admin-users"] });
			toast.success(`${updatedUser.name} promoted to Admin`);
			setConfirmAction(null);
			onRoleChange?.();
		},
		onError: (error: any) => {
			toast.error(error.message);
		},
	});

	const demoteAdminMutation = useMutation({
		mutationFn: (userId: string) => demoteAdminToManager(userId),
		onSuccess: (updatedUser) => {
			queryClient.invalidateQueries({ queryKey: ["admin-users"] });
			toast.success(`${updatedUser.name} demoted to Manager`);
			setConfirmAction(null);
			onRoleChange?.();
		},
		onError: (error: any) => {
			toast.error(error.message);
		},
	});

	const demoteManagerMutation = useMutation({
		mutationFn: (userId: string) => demoteManagerToUser(userId),
		onSuccess: (updatedUser) => {
			queryClient.invalidateQueries({ queryKey: ["admin-users"] });
			toast.success(`${updatedUser.name} demoted to User`);
			setConfirmAction(null);
			onRoleChange?.();
		},
		onError: (error: any) => {
			toast.error(error.message);
		},
	});

	const updatePermsMutation = useMutation({
		mutationFn: ({
			userId,
			key,
			value,
		}: {
			userId: string;
			key: string;
			value: boolean;
		}) =>
			updateCategoryPermissions(userId, {
				[key]: value,
			} as any),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: ["admin-users"] });
			const action = variables.value ? "enabled" : "disabled";
			toast.success(
				`${variables.key.charAt(0).toUpperCase() + variables.key.slice(1)} permission ${action}`,
			);
		},
		onError: (error: any) => {
			toast.error(error.message);
		},
	});

	// Filter and search
	const filteredUsers = useMemo(() => {
		return users.filter((user) => {
			const matchesRole =
				roleFilter === "all" ||
				user.role === roleFilter ||
				(roleFilter === "users" && user.role === "user") || // ← fix
				(roleFilter === "managers" && user.role === "manager") || // ← fix
				(roleFilter === "admins" &&
					(user.role === "admin" || user.role === "super_admin"));
			const matchesSearch =
				searchQuery === "" ||
				user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				user.email.toLowerCase().includes(searchQuery.toLowerCase());
			return matchesRole && matchesSearch;
		});
	}, [users, roleFilter, searchQuery]);

	const canShowSuperAdminTab = currentUser?.isSuperAdmin;

	const getRoleButtons = (user: any) => {
		if (user.isSuperAdmin) {
			return null;
		}

		const buttons = [];

		if (user.role === "user") {
			buttons.push(
				<Button
					key="manager"
					size="sm"
					variant="outline"
					onClick={() =>
						setConfirmAction({ type: "make-manager", user })
					}
					className="text-blue-600 border-blue-200 hover:bg-blue-50"
				>
					<UserCheck className="w-4 h-4 mr-1" />
					Make Manager
				</Button>,
			);
		}

		if (user.role === "manager") {
			if (currentUser?.isSuperAdmin) {
				buttons.push(
					<Button
						key="admin"
						size="sm"
						variant="outline"
						onClick={() =>
							setConfirmAction({ type: "make-admin", user })
						}
						className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
					>
						<ShieldPlus className="w-4 h-4 mr-1" />
						Make Admin
					</Button>,
				);
			}

			if (currentUser?.role === "admin" || currentUser?.isSuperAdmin) {
				buttons.push(
					<Button
						key="user"
						size="sm"
						variant="ghost"
						onClick={() =>
							setConfirmAction({ type: "demote-user", user })
						}
						className="text-red-600 hover:bg-red-50"
					>
						<UserMinus className="w-4 h-4 mr-1" />
						Demote
					</Button>,
				);
			}
		}

		if (user.role === "admin" && currentUser?.isSuperAdmin) {
			buttons.push(
				<Button
					key="manager"
					size="sm"
					variant="outline"
					onClick={() =>
						setConfirmAction({ type: "demote-manager", user })
					}
					className="text-amber-600 border-amber-200 hover:bg-amber-50"
				>
					<ShieldMinus className="w-4 h-4 mr-1" />
					Demote
				</Button>,
			);
		}

		return buttons.length > 0 ? buttons : null;
	};

	return (
		<div className="space-y-4">
			{/* Filter Bar */}
			<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<div className="flex gap-2 flex-wrap">
					{[
						"all",
						"users",
						"managers",
						"admins",
						...(canShowSuperAdminTab ? ["super_admin"] : []),
					].map((role) => (
						<Button
							key={role}
							size="sm"
							variant={
								roleFilter === role ? "default" : "outline"
							}
							onClick={() => setRoleFilter(role)}
						>
							{role === "all"
								? "All"
								: role === "users"
									? "Users"
									: role === "managers"
										? "Managers"
										: role === "admins"
											? "Admins"
											: "Super Admin"}
						</Button>
					))}
				</div>

				<div className="relative">
					<Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
					<Input
						placeholder="Search by name or email..."
						className="pl-8"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
			</div>

			{/* User Table */}
			<div className="border rounded-lg overflow-hidden">
				<Table>
					<TableHeader className="bg-muted/50">
						<TableRow>
							<TableHead>User Info</TableHead>
							<TableHead>Role</TableHead>
							<TableHead>Category Permissions</TableHead>
							<TableHead className="text-right">
								Actions
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoadingUsers ? (
							<UserTableSkeleton />
						) : filteredUsers.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={4}
									className="text-center py-8 text-muted-foreground"
								>
									No users found
								</TableCell>
							</TableRow>
						) : (
							filteredUsers.map((user) => (
								<TableRow
									key={user.id}
									className="hover:bg-muted/50"
								>
									{/* User Info */}
									<TableCell>
										<div className="flex items-center gap-3">
											<UserAvatar
												name={user.name}
												role={user.role}
											/>
											<div>
												<div className="font-semibold">
													{user.name}
												</div>
												<div className="text-sm text-muted-foreground">
													{user.email}
												</div>
											</div>
										</div>
									</TableCell>

									{/* Role */}
									<TableCell>
										<RoleBadge role={user.role} />
									</TableCell>

									{/* Category Permissions */}
									<TableCell>
										{user.role === "manager" ? (
											<div className="flex gap-4">
												{[
													"canCreate",
													"canUpdate",
													"canDelete",
												].map((perm) => (
													<div
														key={perm}
														className="flex items-center gap-2"
													>
														<Switch
															checked={
																user
																	.categoryPermissions?.[
																	perm as keyof typeof user.categoryPermissions
																] || false
															}
															onCheckedChange={(
																checked,
															) => {
																updatePermsMutation.mutate(
																	{
																		userId: user.id,
																		key: perm,
																		value: checked,
																	},
																);
															}}
															disabled={
																updatePermsMutation.isPending
															}
														/>
														{updatePermsMutation.isPending &&
															updatePermsMutation
																.variables
																?.key ===
																perm && (
																<Loader2 className="w-3 h-3 animate-spin" />
															)}
													</div>
												))}
											</div>
										) : (
											<span className="text-muted-foreground">
												—
											</span>
										)}
									</TableCell>

									{/* Actions */}
									<TableCell className="text-right">
										<div className="flex gap-2 justify-end flex-wrap">
											{user.isSuperAdmin ? (
												<Lock
													className="w-5 h-5 text-yellow-600"
													title="Super Admin cannot be modified"
												/>
											) : (
												getRoleButtons(user)
											)}

											{!user.isSuperAdmin &&
												user.roleHistory?.length >
													0 && (
													<Button
														size="sm"
														variant="ghost"
														onClick={() =>
															setRoleHistoryUser(
																user,
															)
														}
													>
														<Clock className="w-4 h-4" />
													</Button>
												)}
										</div>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{/* Confirmation Dialogs */}
			<AlertDialog
				open={confirmAction !== null}
				onOpenChange={(open) => !open && setConfirmAction(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{confirmAction?.type === "make-manager" &&
								"Promote to Manager?"}
							{confirmAction?.type === "make-admin" &&
								"Promote to Admin?"}
							{confirmAction?.type === "demote-manager" &&
								"Demote to Manager?"}
							{confirmAction?.type === "demote-user" &&
								"Demote to User?"}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{confirmAction?.type === "make-manager" &&
								`${confirmAction.user.name} will gain access to: Orders, Restock Queue, and Activity Log.`}
							{confirmAction?.type === "make-admin" &&
								`${confirmAction.user.name} will gain full system access including this Admin Panel. This action is only available to Super Admin.`}
							{confirmAction?.type === "demote-manager" &&
								`${confirmAction.user.name} will lose Admin Panel access and all admin privileges.`}
							{confirmAction?.type === "demote-user" &&
								`${confirmAction.user.name} will lose access to Orders, Restock Queue, Activity Log, and all category permissions.`}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => {
							if (confirmAction?.type === "make-manager") {
								promoteToManagerMutation.mutate(
									confirmAction.user.id,
								);
							} else if (confirmAction?.type === "make-admin") {
								promoteToAdminMutation.mutate(
									confirmAction.user.id,
								);
							} else if (
								confirmAction?.type === "demote-manager"
							) {
								demoteAdminMutation.mutate(
									confirmAction.user.id,
								);
							} else if (confirmAction?.type === "demote-user") {
								demoteManagerMutation.mutate(
									confirmAction.user.id,
								);
							}
						}}
						disabled={
							promoteToManagerMutation.isPending ||
							promoteToAdminMutation.isPending ||
							demoteAdminMutation.isPending ||
							demoteManagerMutation.isPending
						}
					>
						{(promoteToManagerMutation.isPending ||
							promoteToAdminMutation.isPending ||
							demoteAdminMutation.isPending ||
							demoteManagerMutation.isPending) && (
							<Loader2 className="w-4 h-4 mr-2 animate-spin" />
						)}
						Confirm
					</AlertDialogAction>
				</AlertDialogContent>
			</AlertDialog>

			{/* Role History Sheet */}
			<Sheet
				open={roleHistoryUser !== null}
				onOpenChange={(open) => !open && setRoleHistoryUser(null)}
			>
				<SheetContent className="w-full sm:max-w-md">
					<SheetHeader>
						<SheetTitle>
							{roleHistoryUser?.name}&apos;s Role History
						</SheetTitle>
						<SheetDescription>
							All role changes for this user
						</SheetDescription>
					</SheetHeader>

					<div className="mt-4 space-y-4">
						{roleHistoryUser?.roleHistory?.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								No role changes recorded
							</p>
						) : (
							roleHistoryUser?.roleHistory?.map(
								(entry: any, idx: number) => (
									<div
										key={idx}
										className="pb-4 border-b last:border-b-0"
									>
										<div className="text-xs text-muted-foreground">
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
										</div>
										<div className="text-sm font-medium mt-1">
											{entry.fromRole.toUpperCase()} →{" "}
											{entry.toRole.toUpperCase()}
										</div>
										{entry.changedBy && (
											<div className="text-xs text-muted-foreground mt-1">
												Changed by:{" "}
												{entry.changedBy.name}
											</div>
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

// ─────────────────────────────────────────────────────────────
// TAB 2: PENDING APPROVALS
// ─────────────────────────────────────────────────────────────

interface PendingApprovalsProps {
	isLoadingProducts: boolean;
	products: any[];
	totalPending: number;
}

function PendingApprovals({
	isLoadingProducts,
	products,
	totalPending,
}: PendingApprovalsProps) {
	const [selectedProduct, setSelectedProduct] = useState<any>(null);
	const [confirmApprove, setConfirmApprove] = useState<any>(null);
	const [rejectDialog, setRejectDialog] = useState<any>(null);
	const [rejectReason, setRejectReason] = useState("");
	const queryClient = useQueryClient();

	const approveMutation = useMutation({
		mutationFn: (productId: string) => approveProduct(productId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["pending-products"] });
			toast.success("✅ Product approved!");
			setConfirmApprove(null);
		},
		onError: (error: any) => {
			toast.error(error.message);
		},
	});

	const rejectMutation = useMutation({
		mutationFn: (productId: string) =>
			rejectProduct(productId, { reason: rejectReason }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["pending-products"] });
			toast.success("Product rejected");
			setRejectDialog(null);
			setRejectReason("");
		},
		onError: (error: any) => {
			toast.error(error.message);
		},
	});

	if (totalPending === 0 && !isLoadingProducts) {
		return (
			<div className="flex flex-col items-center justify-center py-16">
				<CheckCircle className="w-16 h-16 text-green-500 mb-4" />
				<h3 className="text-lg font-semibold">All caught up!</h3>
				<p className="text-muted-foreground">
					No products are awaiting approval.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{isLoadingProducts ? (
					[...Array(4)].map((_, i) => (
						<ApprovalCardSkeleton key={i} />
					))
				) : products.length === 0 ? (
					<div className="col-span-full text-center py-8 text-muted-foreground">
						No pending products
					</div>
				) : (
					<AnimatePresence>
						{products.map((product) => (
							<motion.div
								key={product.id}
								initial={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.95 }}
								transition={{ duration: 0.2 }}
							>
								<div className="rounded-lg border border-border bg-card p-6 hover:shadow-md transition-shadow">
									<div className="flex justify-between items-start mb-4">
										<h3 className="font-semibold text-lg">
											{product.name}
										</h3>
										<Badge variant="secondary">
											⏳ Pending
										</Badge>
									</div>

									<div className="space-y-2 mb-4 text-sm">
										<div>
											<span className="text-muted-foreground">
												Category:{" "}
											</span>
											<span className="font-medium">
												{product.category.name}
											</span>
										</div>
										<div>
											<span className="text-muted-foreground">
												Price:{" "}
											</span>
											<span className="font-medium">
												${product.price.toFixed(2)}
											</span>
											<span className="text-muted-foreground ml-4">
												Stock: {product.stock} units
											</span>
										</div>
										<div>
											<span className="text-muted-foreground">
												Min Threshold:{" "}
											</span>
											<span className="font-medium">
												{product.minStockThreshold}{" "}
												units
											</span>
										</div>
									</div>

									<div className="bg-muted/50 rounded p-3 mb-4 text-sm">
										<div className="font-medium mb-1">
											Submitted by:
										</div>
										<div className="flex items-center gap-2">
											<div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
												{product.createdBy.name
													.split(" ")
													.map((n: string) => n[0])
													.join("")
													.toUpperCase()
													.slice(0, 2)}
											</div>
											<div>
												<div className="font-medium">
													{product.createdBy.name}
												</div>
												<div className="text-xs text-muted-foreground">
													{product.createdBy.role} ·{" "}
													{new Date(
														product.createdAt,
													).toLocaleDateString(
														"en-US",
														{
															month: "short",
															day: "numeric",
															year: "numeric",
														},
													)}
												</div>
											</div>
										</div>
									</div>

									<div className="flex gap-2">
										<Button
											className="flex-1 bg-green-600 hover:bg-green-700"
											onClick={() =>
												setConfirmApprove(product)
											}
										>
											✅ Approve
										</Button>
										<Button
											variant="destructive"
											className="flex-1"
											onClick={() =>
												setRejectDialog(product)
											}
										>
											❌ Reject
										</Button>
									</div>
								</div>
							</motion.div>
						))}
					</AnimatePresence>
				)}
			</div>

			{/* Approve Dialog */}
			<AlertDialog
				open={confirmApprove !== null}
				onOpenChange={(open) => !open && setConfirmApprove(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Approve &quot;{confirmApprove?.name}&quot;?
						</AlertDialogTitle>
						<AlertDialogDescription>
							It will become visible to all users.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={() =>
							approveMutation.mutate(confirmApprove.id)
						}
						disabled={approveMutation.isPending}
					>
						{approveMutation.isPending && (
							<Loader2 className="w-4 h-4 mr-2 animate-spin" />
						)}
						Approve
					</AlertDialogAction>
				</AlertDialogContent>
			</AlertDialog>

			{/* Reject Dialog */}
			<Dialog
				open={rejectDialog !== null}
				onOpenChange={(open) => !open && setRejectDialog(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Reject Product</DialogTitle>
						<DialogDescription>
							{rejectDialog?.name}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div>
							<label className="text-sm font-medium">
								Reason for rejection
							</label>
							<Textarea
								placeholder="Provide a reason (minimum 10 characters)..."
								value={rejectReason}
								onChange={(e) =>
									setRejectReason(e.target.value)
								}
								className="mt-2"
								rows={4}
							/>
							<div className="text-xs text-muted-foreground mt-1">
								{rejectReason.length} characters
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setRejectDialog(null);
								setRejectReason("");
							}}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() =>
								rejectMutation.mutate(rejectDialog.id)
							}
							disabled={
								rejectReason.length < 10 ||
								rejectMutation.isPending
							}
						>
							{rejectMutation.isPending && (
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
							)}
							Reject Product
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────

export default function AdminPanel() {
	const { user: currentUser } = useAuthStore();
	const queryClient = useQueryClient();

	// Queries
	const { data: usersData, isLoading: isLoadingUsers } = useQuery({
		queryKey: ["admin-users"],
		queryFn: () =>
			getUsers({
				page: 1,
				limit: 100,
			}),
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

	if (!isAdmin) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-center">
					<h1 className="text-2xl font-bold mb-2">Access Denied</h1>
					<p className="text-muted-foreground">
						You don&apos;t have permission to access this page.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div className="flex items-center gap-2">
					<h1 className="text-3xl font-bold">Admin Panel</h1>
					{isSuperAdmin ? (
						<Badge className="bg-yellow-100 text-yellow-900 border-yellow-300">
							👑 Super Admin
						</Badge>
					) : (
						<Badge className="bg-indigo-100 text-indigo-900 border-indigo-300">
							🛡️ Admin
						</Badge>
					)}
				</div>
				<div className="text-muted-foreground text-sm">
					{usersData?.total || 0} users total
				</div>
			</div>

			{/* Tabs */}
			<Tabs defaultValue="users" className="w-full">
				<TabsList>
					<TabsTrigger value="users">User Management</TabsTrigger>
					<TabsTrigger value="approvals" className="relative">
						Pending Approvals
						{productsData?.total > 0 && (
							<Badge
								variant="destructive"
								className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
							>
								{productsData.total}
							</Badge>
						)}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="users" className="mt-6">
					<UserManagement
						currentUser={currentUser}
						isLoadingUsers={isLoadingUsers}
						users={usersData?.users || []}
						totalUsers={usersData?.total || 0}
						onRoleChange={() => {
							queryClient.invalidateQueries({
								queryKey: ["admin-users"],
							});
						}}
					/>
				</TabsContent>

				<TabsContent value="approvals" className="mt-6">
					<PendingApprovals
						isLoadingProducts={isLoadingProducts}
						products={productsData?.products || []}
						totalPending={productsData?.total || 0}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}
