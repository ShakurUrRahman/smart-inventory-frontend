import axios from "axios";
import { toast } from "sonner";

const apiClient = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
	withCredentials: true,
	headers: {
		"Content-Type": "application/json",
	},
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
	(response) => response,
	async (error) => {
		if (!error.response) {
			// Network error
			toast.error("Network error — check your connection");
			return Promise.reject(error);
		}

		const status = error.response.status;

		if (status === 401) {
			// Unauthorized - clear auth and redirect to login
			const { useAuthStore } = await import("@/store/authStore");
			const { clearUser } = useAuthStore();
			clearUser();
			window.location.href = "/login";
			toast.error("Session expired. Please log in again.");
		} else if (status === 500) {
			// Server error
			toast.error("Server error — please try again later");
		} else if (status === 400 || status === 404) {
			// Bad request or not found - let the caller handle it
			return Promise.reject(error);
		}

		return Promise.reject(error);
	},
);

export default apiClient;
