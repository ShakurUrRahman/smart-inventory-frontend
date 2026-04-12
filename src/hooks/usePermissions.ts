// hooks/usePermissions.ts
import { useAuthStore } from "@/store/authStore";

const usePermissions = () => {
	const { user } = useAuthStore();

	const role = user?.role ?? "";

	return {
		// ── Role identity ──────────────────────────────────────────────────────
		isUser: role === "user",
		isManager: role === "manager",
		isAdmin: role === "admin",
		isSuperAdmin: role === "super_admin",

		isAtLeastManager: ["manager", "admin", "super_admin"].includes(role),
		isAtLeastAdmin: ["admin", "super_admin"].includes(role),

		// ── Route access ───────────────────────────────────────────────────────
		canAccessAdminPanel: ["manager", "admin", "super_admin"].includes(role),
		canAccessOrders: ["manager", "admin", "super_admin"].includes(role),
		canAccessActivity: ["manager", "admin", "super_admin"].includes(role),

		// ── Category permissions ───────────────────────────────────────────────
		// admin/super_admin → always true
		// manager → depends on individual permission flags
		// user → always false
		canCreateCategory:
			["admin", "super_admin"].includes(role) ||
			(role === "manager" &&
				user?.categoryPermissions?.canCreate === true),

		canUpdateCategory:
			["admin", "super_admin"].includes(role) ||
			(role === "manager" &&
				user?.categoryPermissions?.canUpdate === true),

		canDeleteCategory:
			["admin", "super_admin"].includes(role) ||
			(role === "manager" &&
				user?.categoryPermissions?.canDelete === true),

		// ── Product permissions ────────────────────────────────────────────────
		canApproveProduct: ["manager", "admin", "super_admin"].includes(role),
		canEditAnyProduct: ["manager", "admin", "super_admin"].includes(role),

		// ── User management ────────────────────────────────────────────────────
		canPromoteToManager: ["admin", "super_admin"].includes(role),
		canPromoteToAdmin: role === "super_admin",
		canDemoteToManager: role === "super_admin",
		canDemoteToUser: ["admin", "super_admin"].includes(role),
	};
};

export default usePermissions;
