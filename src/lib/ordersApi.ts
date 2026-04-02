import apiClient from "./api";

export interface OrderItem {
	product: {
		_id: string;
		name: string;
		status: string;
	};
	productName: string;
	quantity: number;
	unitPrice: number;
	subtotal: number;
}

export interface Order {
	_id: string;
	orderNumber: string;
	customerName: string;
	items: OrderItem[];
	totalPrice: number;
	status: "Pending" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled";
	createdBy: {
		_id: string;
		name: string;
	};
	createdAt: string;
	updatedAt: string;
}

export interface OrdersResponse {
	success: boolean;
	data: Order[];
	total: number;
	page: number;
	totalPages: number;
	limit: number;
}

export interface CreateOrderPayload {
	customerName: string;
	items: Array<{
		productId: string;
		quantity: number;
	}>;
}

export interface UpdateOrderStatusPayload {
	status: "Pending" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled";
}

export const ordersApi = {
	// Get all orders with filters
	getAllOrders: async (params: {
		status?: string;
		date?: string;
		search?: string;
		page?: number;
		limit?: number;
	}): Promise<OrdersResponse> => {
		try {
			const query = new URLSearchParams();
			if (params.status) query.append("status", params.status);
			if (params.date) query.append("date", params.date);
			if (params.search) query.append("search", params.search);
			if (params.page) query.append("page", params.page.toString());
			if (params.limit) query.append("limit", params.limit.toString());

			const response = await apiClient.get(`/orders?${query.toString()}`);
			return response.data;
		} catch (error: any) {
			throw new Error(
				error.response?.data?.message || "Failed to fetch orders",
			);
		}
	},

	// Get single order
	getOrder: async (id: string): Promise<Order> => {
		try {
			const response = await apiClient.get(`/orders/${id}`);
			return response.data.data;
		} catch (error: any) {
			throw new Error(
				error.response?.data?.message || "Failed to fetch order",
			);
		}
	},

	// Create order
	createOrder: async (payload: CreateOrderPayload): Promise<Order> => {
		try {
			const response = await apiClient.post("/orders", payload);
			if (!response.data.success) {
				// Handle validation conflicts
				if (response.data.conflicts) {
					const errorMsg = response.data.conflicts
						.map((c: any) => c.error || c.name || "Unknown error")
						.join("\n");
					throw new Error(errorMsg);
				}
				throw new Error(
					response.data.message || "Failed to create order",
				);
			}
			return response.data.data;
		} catch (error: any) {
			throw new Error(
				error.response?.data?.message ||
					error.message ||
					"Failed to create order",
			);
		}
	},

	// Update order status
	updateOrderStatus: async (
		id: string,
		payload: UpdateOrderStatusPayload,
	): Promise<Order> => {
		try {
			const response = await apiClient.patch(
				`/orders/${id}/status`,
				payload,
			);
			if (!response.data.success) {
				throw new Error(
					response.data.message || "Failed to update order status",
				);
			}
			return response.data.data;
		} catch (error: any) {
			throw new Error(
				error.response?.data?.message ||
					"Failed to update order status",
			);
		}
	},
};
