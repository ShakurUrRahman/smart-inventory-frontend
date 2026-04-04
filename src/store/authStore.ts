import { create } from "zustand";
import { persist } from "zustand/middleware";
import apiClient from "@/lib/api";
import Cookies from "js-cookie";
import { getMe } from "@/lib/authApi"; // ← add this import

export interface User {
	id: string;
	name: string;
	email: string;
	role: "admin" | "manager";
	createdAt?: string;
}

interface AuthStore {
	user: User | null;
	token: string | null;
	isLoading: boolean;
	isHydrated: boolean;
	setUser: (user: User) => void;
	setToken: (token: string) => void;
	clearUser: () => void;
	setIsLoading: (loading: boolean) => void;
	setIsHydrated: (hydrated: boolean) => void;
	rehydrateUser: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
	persist(
		(set, get) => ({
			user: null,
			token: null,
			isLoading: false,
			isHydrated: false,

			setUser: (user: User) => set({ user }),
			setToken: (token: string) => set({ token }),

			clearUser: () => {
				Cookies.remove("token");
				set({ user: null, token: null, isHydrated: false });
				try {
					localStorage.removeItem("auth-store");
				} catch (error) {
					console.log("Error clearing localStorage:", error);
				}
			},

			setIsLoading: (loading: boolean) => set({ isLoading: loading }),
			setIsHydrated: (hydrated: boolean) => set({ isHydrated: hydrated }),

			rehydrateUser: async () => {
				try {
					const data = await getMe();
					if (data?.user) {
						const token = Cookies.get("token");
						if (!token && get().token) {
							// Use stored token from persist if cookie missing
							Cookies.set("token", get().token!, {
								expires: 7,
								sameSite: "lax",
								secure: process.env.NODE_ENV === "production",
							});
						}
						set({ user: data.user, isHydrated: true });
					} else {
						Cookies.remove("token");
						set({ user: null, token: null, isHydrated: true });
					}
				} catch {
					Cookies.remove("token");
					set({ user: null, token: null, isHydrated: true }); // ← always resolve
				}
			},
		}),
		{
			name: "auth-store",
			partialize: (state) => ({ user: state.user, token: state.token }),
		},
	),
);
