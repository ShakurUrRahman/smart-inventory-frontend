import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
	title: "InventoryOS — Smart Inventory Management",
	description:
		"Professional inventory management system with real-time tracking, order management, and analytics",
	keywords: ["inventory", "management", "orders", "stock", "dashboard"],
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className="dark">
			<head>
				<meta charSet="utf-8" />
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1"
				/>
			</head>
			<body className="bg-[#0a0d12]">
				<Providers>{children}</Providers>
				<Toaster position="top-right" theme="dark" />
			</body>
		</html>
	);
}
