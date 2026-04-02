import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Authentication | InventoryOS",
	description: "Sign in to your InventoryOS account",
};

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen w-full bg-[#0a0d12] flex items-center justify-center p-4">
			{children}
		</div>
	);
}
