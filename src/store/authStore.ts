import { create } from "zustand";
import { persist } from "zustand/middleware";
import Cookies from "js-cookie";
import { getMe } from "@/lib/authApi";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CategoryPermissions {
	canCreate: boolean;
	canUpdate: boolean;
	canDelete: boolean;
}

export interface User {
	id: string;
	name: string;
	email: string;
	role: "super_admin" | "admin" | "manager" | "user"; // ← expanded
	isSuperAdmin: boolean; // ← new
	categoryPermissions: CategoryPermissions; // ← new
	isActive: boolean; // ← new
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

// ─── Store ────────────────────────────────────────────────────────────────────

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
						// Re-set cookie if missing (cross-domain on Vercel)
						const existingCookie = Cookies.get("token");
						if (!existingCookie && get().token) {
							Cookies.set("token", get().token!, {
								expires: 7,
								sameSite: "lax",
								secure: process.env.NODE_ENV === "production",
							});
						}

						// Map full RBAC user from /api/auth/me response
						set({
							user: {
								id: data.user.id || data.user._id,
								name: data.user.name,
								email: data.user.email,
								role: data.user.role,
								isSuperAdmin: data.user.isSuperAdmin ?? false,
								categoryPermissions: data.user
									.categoryPermissions ?? {
									canCreate: false,
									canUpdate: false,
									canDelete: false,
								},
								isActive: data.user.isActive ?? true,
								createdAt: data.user.createdAt,
							},
							isHydrated: true,
						});
					} else {
						Cookies.remove("token");
						set({ user: null, token: null, isHydrated: true });
					}
				} catch {
					Cookies.remove("token");
					set({ user: null, token: null, isHydrated: true });
				}
			},
		}),
		{
			name: "auth-store",
			partialize: (state) => ({ user: state.user, token: state.token }),
		},
	),
);
