import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireSession } from "@/lib/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  if (session.user.mustChangePassword) redirect("/change-password");
  return <DashboardShell role={session.user.role}>{children}</DashboardShell>;
}
