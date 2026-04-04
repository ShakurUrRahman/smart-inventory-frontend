// components/layout/ProtectedLayout.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Loader2 } from "lucide-react";

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
	const { user, isHydrated } = useAuthStore();
	const router = useRouter();

	useEffect(() => {
		if (isHydrated && !user) {
			router.replace("/login");
		}
	}, [isHydrated, user, router]);

	// Show loader while checking auth
	if (!isHydrated) {
		return (
			<div className="min-h-screen bg-[#0F1117] flex items-center justify-center">
				<div className="flex flex-col items-center gap-3">
					<Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
					<p className="text-zinc-400 text-sm">Loading...</p>
				</div>
			</div>
		);
	}

	// Don't render children if not authenticated
	if (!user) return null;

	return <>{children}</>;
}
