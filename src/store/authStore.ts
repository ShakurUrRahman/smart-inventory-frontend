import { create } from "zustand";
import { persist } from "zustand/middleware";
import apiClient from "@/lib/api";

export interface User {
	id: string;
	name: string;
	email: string;
	role: "admin" | "manager";
	createdAt?: string;
}

interface AuthStore {
	user: User | null;
	isLoading: boolean;
	isHydrated: boolean;
	setUser: (user: User) => void;
	clearUser: () => void;
	setIsLoading: (loading: boolean) => void;
	setIsHydrated: (hydrated: boolean) => void;
	rehydrateUser: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
	persist(
		(set) => ({
			user: null,
			isLoading: false,
			isHydrated: false,

			setUser: (user: User) => set({ user }),

			clearUser: () => {
				// Clear Zustand state
				set({ user: null, isHydrated: false });
				// Also clear localStorage manually
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
					set({ isLoading: true });
					const response = await apiClient.get("/auth/me");

					if (response.data.success && response.data.user) {
						set({
							user: response.data.user,
							isLoading: false,
							isHydrated: true,
						});
					} else {
						set({ user: null, isLoading: false, isHydrated: true });
					}
				} catch (error) {
					// Silently fail - user is not authenticated
					console.log("User not authenticated");
					set({ user: null, isLoading: false, isHydrated: true });
				}
			},
		}),
		{
			name: "auth-store",
			partialize: (state) => ({ user: state.user }),
		},
	),
);
