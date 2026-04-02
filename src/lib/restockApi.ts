import apiClient from "./api";
import { Product } from "./productsApi";

export interface RestockQueueItem {
	_id: string;
	product: {
		_id: string;
		name: string;
		category?: string;
		stock: number;
		minStockThreshold: number;
		status: string;
	};
	currentStock: number;
	priority: "High" | "Medium" | "Low";
	isResolved: boolean;
	resolvedAt: string | null;
	createdAt: string; // ← use this
	updatedAt: string;
}

export interface RestockQueueResponse {
	success: boolean;
	data: RestockQueueItem[];
	total: number;
	page: number;
	totalPages: number;
	limit: number;
}

export interface ResolveRestockPayload {
	quantity: number;
}

export const restockApi = {
	// Get restock queue items
	getRestockQueue: async (params: {
		priority?: string;
		page?: number;
		limit?: number;
	}): Promise<RestockQueueResponse> => {
		try {
			const query = new URLSearchParams();
			if (params.priority) query.append("priority", params.priority);
			if (params.page) query.append("page", params.page.toString());
			if (params.limit) query.append("limit", params.limit.toString());

			const response = await apiClient.get(
				`/restock?${query.toString()}`,
			);
			return response.data;
		} catch (error: any) {
			throw new Error(
				error.response?.data?.message ||
					"Failed to fetch restock queue",
			);
		}
	},

	// Get restock count (for sidebar badge)
	getRestockCount: async (): Promise<number> => {
		try {
			const response = await apiClient.get("/restock?limit=1");
			return response.data.total || 0;
		} catch (error: any) {
			return 0;
		}
	},

	// Resolve restock item (add stock)
	resolveRestockItem: async (
		id: string,
		payload: ResolveRestockPayload,
	): Promise<any> => {
		try {
			const response = await apiClient.patch(
				`/restock/${id}/resolve`,
				payload,
			);
			if (!response.data.success) {
				throw new Error(
					response.data.message || "Failed to resolve restock item",
				);
			}
			return response.data.data;
		} catch (error: any) {
			throw new Error(
				error.response?.data?.message ||
					"Failed to resolve restock item",
			);
		}
	},

	// Remove from queue (admin override)
	removeFromQueue: async (id: string): Promise<void> => {
		try {
			const response = await apiClient.delete(`/restock/${id}`);
			if (!response.data.success) {
				throw new Error(
					response.data.message || "Failed to remove item",
				);
			}
		} catch (error: any) {
			throw new Error(
				error.response?.data?.message ||
					"Failed to remove item from queue",
			);
		}
	},
};
