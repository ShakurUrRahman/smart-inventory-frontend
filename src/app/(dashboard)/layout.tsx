import type { Metadata } from "next";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { useState } from "react";

export const metadata: Metadata = {
	title: "Dashboard | InventoryOS",
	description: "Dashboard",
};

export default function RootDashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ProtectedLayout>
			<DashboardLayout pageTitle="Dashboard">{children}</DashboardLayout>
		</ProtectedLayout>
	);
}
