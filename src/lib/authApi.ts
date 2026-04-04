import apiClient from "./api";
import Cookies from "js-cookie";

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function handleResponse<T>(res: Response): Promise<T> {
	const data = await res.json();
	if (!res.ok) {
		throw new Error(data.message || "Something went wrong");
	}
	return data as T;
}

export async function loginUser(email: string, password: string) {
	const res = await fetch(`${API_URL}/auth/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body: JSON.stringify({ email, password }),
	});
	const data = await handleResponse<{
		success: boolean;
		token: string;
		user: any;
	}>(res);

	Cookies.set("token", data.token, {
		expires: 7,
		sameSite: "lax",
		secure: true,
	});

	return data;
}

export const getMe = async () => {
	try {
		const response = await apiClient.get("/auth/me");
		if (!response.data.success) return null;
		return response.data; // returns { success, user }
	} catch {
		return null;
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

export async function logoutUser() {
	await fetch(`${API_URL}/auth/logout`, {
		method: "POST",
		credentials: "include",
	});
	Cookies.remove("token");
}

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
