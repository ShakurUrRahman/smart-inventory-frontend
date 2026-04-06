"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

interface ProtectedLayoutProps {
	children: React.ReactNode;
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
	const router = useRouter();
	const { user, rehydrateUser } = useAuthStore();
	const [isChecking, setIsChecking] = useState(true);

	useEffect(() => {
		const checkAuth = async () => {
			// If user already exists in store (just logged in or persisted)
			if (user) {
				setIsChecking(false);
				return;
			}

			// Try to rehydrate from token
			try {
				await rehydrateUser();
				// After rehydration, check again
				const currentUser = useAuthStore.getState().user;
				if (!currentUser) {
					router.replace("/login");
				}
			} catch {
				router.replace("/login");
			} finally {
				setIsChecking(false);
			}
		};

		checkAuth();
	}, []); // ← run only once on mount

	if (isChecking) {
		return (
			<div className="min-h-screen bg-[#0a0d12] flex items-center justify-center">
				<div className="text-white text-center">
					<div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
					<p className="text-zinc-400 text-sm">Loading...</p>
				</div>
			</div>
		);
	}

	if (!user) return null;

	return <>{children}</>;
}
