// lib/categoriesApi.ts
import apiClient from "./api";

export interface Category {
	_id: string;
	name: string;
	productCount: number;
	createdAt: string;
}

export interface CreateCategoryPayload {
	name: string;
}

export interface UpdateCategoryPayload {
	name: string;
}

export const categoriesApi = {
	// Get all categories
	getAllCategories: async (): Promise<Category[]> => {
		try {
			const response = await apiClient.get("/categories");
			return response.data.data || [];
		} catch (error: any) {
			throw new Error(
				error.response?.data?.message || "Failed to fetch categories",
			);
		}
	},

	// Create category
	createCategory: async (
		payload: CreateCategoryPayload,
	): Promise<Category> => {
		try {
			const response = await apiClient.post("/categories", payload);
			if (!response.data.success) {
				throw new Error(
					response.data.message || "Failed to create category",
				);
			}
			return response.data.data;
		} catch (error: any) {
			throw new Error(
				error.response?.data?.message || "Failed to create category",
			);
		}
	},

	// Update category
	updateCategory: async (
		id: string,
		payload: UpdateCategoryPayload,
	): Promise<Category> => {
		try {
			const response = await apiClient.put(`/categories/${id}`, payload);
			if (!response.data.success) {
				throw new Error(
					response.data.message || "Failed to update category",
				);
			}
			return response.data.data;
		} catch (error: any) {
			throw new Error(
				error.response?.data?.message || "Failed to update category",
			);
		}
	},

	// Delete category
	deleteCategory: async (id: string): Promise<void> => {
		try {
			const response = await apiClient.delete(`/categories/${id}`);
			if (!response.data.success) {
				throw new Error(
					response.data.message || "Failed to delete category",
				);
			}
		} catch (error: any) {
			throw new Error(
				error.response?.data?.message || "Failed to delete category",
			);
		}
	},

	// Get single category
	getCategoryById: async (id: string): Promise<Category> => {
		try {
			const response = await apiClient.get(`/categories/${id}`);
			return response.data.data;
		} catch (error: any) {
			throw new Error(
				error.response?.data?.message || "Failed to fetch category",
			);
		}
	},
};
