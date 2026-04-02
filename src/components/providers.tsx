"use client";

import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";

// Create a client for TanStack Query
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			gcTime: 1000 * 60 * 10, // 10 minutes (previously cacheTime)
		},
	},
});

export function Providers({ children }: { children: React.ReactNode }) {
	const { rehydrateUser, isHydrated } = useAuthStore();

	useEffect(() => {
		// Rehydrate user on app load
		if (!isHydrated) {
			rehydrateUser();
		}
	}, [isHydrated, rehydrateUser]);

	return (
		<QueryClientProvider client={queryClient}>
			{children}
		</QueryClientProvider>
	);
}
