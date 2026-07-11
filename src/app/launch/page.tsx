import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function LaunchPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.mustChangePassword) redirect("/change-password");
  redirect(session.user.role === "ADMIN" ? "/admin/dashboard" : "/employee/dashboard");
}
