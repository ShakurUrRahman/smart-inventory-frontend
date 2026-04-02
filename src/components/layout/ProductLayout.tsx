"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

interface ProtectedLayoutProps {
	children: React.ReactNode;
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
	const router = useRouter();
	const { user, isHydrated } = useAuthStore();
	const [isChecking, setIsChecking] = useState(true);

	useEffect(() => {
		// Wait for store to hydrate from localStorage
		if (!isHydrated) {
			return;
		}

		setIsChecking(false);

		// If no user after hydration, redirect to login
		if (!user) {
			router.replace("/login");
			return;
		}
	}, [user, isHydrated, router]);

	// Show nothing while checking auth
	if (isChecking || !isHydrated || !user) {
		return (
			<div className="min-h-screen bg-[#0a0d12] flex items-center justify-center">
				<div className="text-white text-center">
					<div className="animate-spin mb-4">
						<div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
					</div>
					<p>Loading...</p>
				</div>
			</div>
		);
	}

	return <>{children}</>;
}
