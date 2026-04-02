import apiClient from "./api";

export interface LoginResponse {
	success: boolean;
	message: string;
	token: string;
	user: {
		id: string;
		name: string;
		email: string;
		role: "admin" | "manager";
	};
}

export interface RegisterResponse {
	success: boolean;
	message: string;
	user: {
		id: string;
		name: string;
		email: string;
		role: "admin" | "manager";
	};
}

export const loginUser = async (
	email: string,
	password: string,
): Promise<LoginResponse> => {
	try {
		const response = await apiClient.post<LoginResponse>("/auth/login", {
			email,
			password,
		});

		if (!response.data.success) {
			throw new Error(response.data.message || "Login failed");
		}

		return response.data;
	} catch (error: any) {
		throw new Error(
			error.response?.data?.message || error.message || "Login failed",
		);
	}
};

export const registerUser = async (
	name: string,
	email: string,
	password: string,
): Promise<RegisterResponse> => {
	try {
		const response = await apiClient.post<RegisterResponse>(
			"/auth/register",
			{
				name,
				email,
				password,
			},
		);

		if (!response.data.success) {
			throw new Error(response.data.message || "Registration failed");
		}

		return response.data;
	} catch (error: any) {
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Registration failed",
		);
	}
};

export const logoutUser = async (): Promise<void> => {
	try {
		await apiClient.post("/auth/logout");
	} catch (error: any) {
		throw new Error(error.response?.data?.message || "Logout failed");
	}
};

export const getCurrentUser = async () => {
	try {
		const response = await apiClient.get("/auth/me");
		if (!response.data.success) {
			throw new Error("Failed to fetch user");
		}
		return response.data.user;
	} catch (error: any) {
		throw new Error(
			error.response?.data?.message || "Failed to fetch user",
		);
	}
};
