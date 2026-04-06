import apiClient from "./api";

// ─────────────────────────────────────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────────────────────────────────────

export interface GetUsersParams {
	role?: string;
	search?: string;
	page?: number;
	limit?: number;
}

export interface User {
	id: string;
	name: string;
	email: string;
	role: "user" | "manager" | "admin" | "super_admin";
	isSuperAdmin: boolean;
	categoryPermissions: {
		canCreate: boolean;
		canUpdate: boolean;
		canDelete: boolean;
	};
	isActive: boolean;
	roleHistory: Array<{
		fromRole: string;
		toRole: string;
		changedBy?: {
			id: string;
			name: string;
			email: string;
		};
		changedAt: string;
		reason?: string;
	}>;
	createdAt: string;
}

export interface GetUsersResponse {
	success: boolean;
	users: User[];
	total: number;
	page: number;
	totalPages: number;
}

export const getUsers = async (
	params: GetUsersParams,
): Promise<GetUsersResponse> => {
	try {
		const response = await apiClient.get<GetUsersResponse>("/admin/users", {
			params,
		});
		return response.data;
	} catch (error: any) {
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Failed to fetch users",
		);
	}
};

// ─────────────────────────────────────────────────────────────
// ROLE PROMOTIONS & DEMOTIONS
// ─────────────────────────────────────────────────────────────

export const promoteToManager = async (userId: string): Promise<User> => {
	try {
		const response = await apiClient.patch<{
			success: boolean;
			user: User;
		}>(`/admin/users/${userId}/promote-manager`);
		return response.data.user;
	} catch (error: any) {
		throw new Error(
			error.response?.data?.message || "Failed to promote to manager",
		);
	}
};

export const promoteToAdmin = async (userId: string): Promise<User> => {
	try {
		const response = await apiClient.patch<{
			success: boolean;
			user: User;
		}>(`/admin/users/${userId}/promote-admin`);
		return response.data.user;
	} catch (error: any) {
		throw new Error(
			error.response?.data?.message || "Failed to promote to admin",
		);
	}
};

export const demoteAdminToManager = async (userId: string): Promise<User> => {
	try {
		const response = await apiClient.patch<{
			success: boolean;
			user: User;
		}>(`/admin/users/${userId}/demote-manager`);
		return response.data.user;
	} catch (error: any) {
		throw new Error(
			error.response?.data?.message || "Failed to demote to manager",
		);
	}
};

export const demoteManagerToUser = async (userId: string): Promise<User> => {
	try {
		const response = await apiClient.patch<{
			success: boolean;
			user: User;
		}>(`/admin/users/${userId}/demote-user`);
		return response.data.user;
	} catch (error: any) {
		throw new Error(
			error.response?.data?.message || "Failed to demote to user",
		);
	}
};

export interface UpdatePermissionsPayload {
	canCreate?: boolean;
	canUpdate?: boolean;
	canDelete?: boolean;
}

export const updateCategoryPermissions = async (
	userId: string,
	permissions: UpdatePermissionsPayload,
): Promise<UpdatePermissionsPayload> => {
	try {
		const response = await apiClient.patch<{
			success: boolean;
			categoryPermissions: UpdatePermissionsPayload;
		}>(`/admin/users/${userId}/category-permissions`, permissions);
		return response.data.categoryPermissions;
	} catch (error: any) {
		throw new Error(
			error.response?.data?.message || "Failed to update permissions",
		);
	}
};

// ─────────────────────────────────────────────────────────────
// PRODUCT APPROVAL
// ─────────────────────────────────────────────────────────────

export interface PendingProduct {
	id: string;
	name: string;
	category: {
		id: string;
		name: string;
	};
	price: number;
	stock: number;
	minStockThreshold: number;
	createdBy: {
		id: string;
		name: string;
		email: string;
		role: string;
	};
	createdAt: string;
}

export interface GetPendingProductsResponse {
	success: boolean;
	products: PendingProduct[];
	total: number;
}

export const getPendingProducts =
	async (): Promise<GetPendingProductsResponse> => {
		try {
			const response = await apiClient.get<GetPendingProductsResponse>(
				"/admin/products/pending",
			);
			return response.data;
		} catch (error: any) {
			throw new Error(
				error.response?.data?.message ||
					error.message ||
					"Failed to fetch pending products",
			);
		}
	};

export const approveProduct = async (productId: string): Promise<void> => {
	try {
		await apiClient.patch(`/admin/products/${productId}/approve`);
	} catch (error: any) {
		throw new Error(
			error.response?.data?.message || "Failed to approve product",
		);
	}
};

export interface RejectProductPayload {
	reason: string;
}

export const rejectProduct = async (
	productId: string,
	payload: RejectProductPayload,
): Promise<void> => {
	try {
		await apiClient.patch(`/admin/products/${productId}/reject`, payload);
	} catch (error: any) {
		throw new Error(
			error.response?.data?.message || "Failed to reject product",
		);
	}
};
