import apiClient from "./api";

export interface DashboardStats {
	totalOrdersToday: number;
	pendingOrders: number;
	confirmedOrders: number;
	shippedOrders: number;
	deliveredOrders: number;
	revenueToday: number;
	lowStockCount: number;
	totalProducts: number;
	totalActiveProducts: number;
}

export interface ChartDataPoint {
	date: string;
	count?: number;
	revenue?: number;
}

export interface ProductSummary {
	_id: string;
	name: string;
	stock: number;
	minStockThreshold: number;
	status: string;
	category: string;
}

export interface StatusBreakdown {
	status: string;
	count: number;
}

export interface ActivityEntry {
	_id: string;
	action: string;
	entityType: string;
	description: string;
	createdAt: string;
	userId?: { name: string };
}

export const dashboardApi = {
	// Get dashboard stats
	getStats: async (): Promise<DashboardStats> => {
		try {
			const response = await apiClient.get("/dashboard/stats");
			return response.data.data;
		} catch (error: any) {
			throw new Error(
				error.response?.data?.message || "Failed to fetch stats",
			);
		}
	},

	// Get orders chart data
	getOrdersChart: async (): Promise<ChartDataPoint[]> => {
		try {
			const response = await apiClient.get("/dashboard/orders-chart");
			return response.data.data;
		} catch (error: any) {
			return [];
		}
	},

	// Get revenue chart data
	getRevenueChart: async (): Promise<ChartDataPoint[]> => {
		try {
			const response = await apiClient.get("/dashboard/revenue-chart");
			return response.data.data;
		} catch (error: any) {
			return [];
		}
	},

	// Get product summary
	getProductSummary: async (): Promise<ProductSummary[]> => {
		try {
			const response = await apiClient.get("/dashboard/product-summary");
			return response.data.data;
		} catch (error: any) {
			return [];
		}
	},

	// Get order status breakdown
	getStatusBreakdown: async (): Promise<StatusBreakdown[]> => {
		try {
			const response = await apiClient.get("/dashboard/status-breakdown");
			return response.data.data;
		} catch (error: any) {
			return [];
		}
	},

	// Get recent activity
	getRecentActivity: async (): Promise<ActivityEntry[]> => {
		try {
			const response = await apiClient.get("/dashboard/activity");
			return response.data.data;
		} catch (error: any) {
			return [];
		}
	},
};
