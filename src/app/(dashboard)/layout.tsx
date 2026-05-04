import type { Metadata } from "next";
import { headers } from "next/headers";
import { getDashboardPageTitle } from "@/lib/dashboard-page-title";
import DashboardClientLayout from "./dashboard-client-layout";

const PATHNAME_HEADER = "x-pathname";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const pathname = headersList.get(PATHNAME_HEADER) ?? "/dashboard";
  return {
    title: getDashboardPageTitle(pathname),
  };
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardClientLayout>{children}</DashboardClientLayout>;
}
