import apiClient from "./api";

export interface User {
	_id: string;
	name: string;
	email: string;
}

export interface Product {
	_id: string;
	name: string;
	description: string;
	category: {
		_id: string;
		name: string;
	};
	price: number;
	stock: number;
	minStockThreshold: number;
	status: "Active" | "Out of Stock";
	approvalStatus: "approved" | "pending" | "rejected";
	createdBy: User; // ✅ Added
	image?: string;
	createdAt: string;
	updatedAt: string;
}

export interface ProductsResponse {
	success: boolean;
	data: Product[];
	total: number;
	page: number;
	totalPages: number;
	limit: number;
}

export interface CreateProductPayload {
	name: string;
	description?: string;
	category: string;
	price: number;
	stock: number;
	minStockThreshold: number;
	image?: string;
}

export interface UpdateProductPayload {
	name?: string;
	description?: string;
	category?: string;
	price?: number;
	stock?: number;
	minStockThreshold?: number;
	image?: string;
}

export interface RestockPayload {
	quantity: number;
}

export const productsApi = {
	// Get all products with filters and pagination
	// Users see only their own products, admins see all
	getAllProducts: async (params?: {
		search?: string;
		category?: string;
		status?: string;
		approvalStatus?: string; // ✅ Added
		page?: number;
		limit?: number;
	}): Promise<ProductsResponse> => {
		try {
			const query = new URLSearchParams();
			if (params?.search) query.append("search", params.search);
			if (params?.category) query.append("category", params.category);
			if (params?.status) query.append("status", params.status);
			if (params?.approvalStatus)
				query.append("approvalStatus", params.approvalStatus); // ✅ Added
			if (params?.page) query.append("page", params.page.toString());
			if (params?.limit) query.append("limit", params.limit.toString());

			const response = await apiClient.get(
				`/products?${query.toString()}`,
			);
			return response.data;
		} catch (error: any) {
			throw new Error(
				error.response?.data?.message || "Failed to fetch products",
			);
		}
	},

	// Get single product
	getProduct: async (id: string): Promise<Product> => {
		try {
			const response = await apiClient.get(`/products/${id}`);
			return response.data.data;
		} catch (error: any) {
			throw new Error(
				error.response?.data?.message || "Failed to fetch product",
			);
		}
	},

	// Create product - submits for approval
	createProduct: async (payload: CreateProductPayload): Promise<Product> => {
		try {
			const response = await apiClient.post("/products", payload);
			if (!response.data.success) {
				throw new Error(
					response.data.message || "Failed to create product",
				);
			}
			return response.data.data;
		} catch (error: any) {
			throw new Error(
				error.response?.data?.message || "Failed to create product",
			);
		}
	},

	// Update product - only owner or admin/manager can update
	// Editing approved products resets to pending status
	updateProduct: async (
		id: string,
		payload: UpdateProductPayload,
	): Promise<Product> => {
		try {
			const response = await apiClient.put(`/products/${id}`, payload);
			if (!response.data.success) {
				throw new Error(
					response.data.message || "Failed to update product",
				);
			}
			return response.data.data;
		} catch (error: any) {
			throw new Error(
				error.response?.data?.message || "Failed to update product",
			);
		}
	},

	// Delete product - only owner or admin/manager can delete
	deleteProduct: async (id: string): Promise<void> => {
		try {
			const response = await apiClient.delete(`/products/${id}`);
			if (!response.data.success) {
				throw new Error(
					response.data.message || "Failed to delete product",
				);
			}
		} catch (error: any) {
			throw new Error(
				error.response?.data?.message || "Failed to delete product",
			);
		}
	},

	// Restock product - only owner or admin/manager can restock
	// PUT endpoint changed to PATCH /products/:id/restock
	restockProduct: async (
		id: string,
		payload: RestockPayload,
	): Promise<Product> => {
		try {
			const response = await apiClient.patch(
				`/products/${id}/restock`,
				payload,
			);
			if (!response.data.success) {
				throw new Error(
					response.data.message || "Failed to restock product",
				);
			}
			return response.data.data;
		} catch (error: any) {
			throw new Error(
				error.response?.data?.message || "Failed to restock product",
			);
		}
	},
};
