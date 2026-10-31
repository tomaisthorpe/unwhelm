import type { Metadata } from "next";
import { DashboardClient } from "@/components/dashboard-client";

export const metadata: Metadata = {
  title: "Tasks",
};

export default async function Dashboard() {
  return <DashboardClient />;
}
