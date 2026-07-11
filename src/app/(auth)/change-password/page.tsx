"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { passwordChangeSchema } from "@/lib/validation";

type PasswordInput = z.infer<typeof passwordChangeSchema>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const form = useForm<PasswordInput>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" }
  });

  const onSubmit = async (data: PasswordInput) => {
    setLoading(true);
    const response = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    setLoading(false);
    if (!response.ok) {
      toast.error("Password change failed");
      return;
    }
    toast.success("Password changed. Please sign in again.");
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <main className="grid min-h-screen place-items-center p-4">
      <form onSubmit={form.handleSubmit(onSubmit)} className="glass w-full max-w-md rounded-xl p-6 sm:p-8">
        <div className="mb-6">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-glow">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h1 className="mt-5 text-2xl font-bold">Change default password</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your new password needs at least 8 characters, uppercase, lowercase, and a number.</p>
        </div>
        <div className="space-y-4">
          <Input type="password" placeholder="Current password" {...form.register("currentPassword")} />
          <Input type="password" placeholder="New password" {...form.register("newPassword")} />
          <Input type="password" placeholder="Confirm new password" {...form.register("confirmPassword")} />
        </div>
        <Button className="mt-6 w-full" disabled={loading}>{loading ? "Updating..." : "Update password"}</Button>
      </form>
    </main>
  );
}
