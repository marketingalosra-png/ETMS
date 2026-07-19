

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
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PasswordInput>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (data: PasswordInput) => {
    setLoading(true);
    const response = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoading(false);
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      if (payload.error?.toLowerCase().includes("current")) {
        setError("currentPassword", {
          type: "manual",
          message: payload.error ?? "Current password is incorrect",
        });
      } else {
        toast.error(payload.error ?? "Password change failed. Please try again.");
      }
      return;
    }
    toast.success("Password changed. Please sign in with your new password.");
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <main className="grid min-h-screen place-items-center p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="glass w-full max-w-md rounded-xl p-6 sm:p-8"
        noValidate
      >
        <div className="mb-6">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-glow">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h1 className="mt-5 text-2xl font-bold">Set a new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your new password must be at least 8 characters and include uppercase,
            lowercase, and a number.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="mb-1.5 block text-sm font-medium">
              Current password
            </label>
            <Input
              id="currentPassword"
              type="password"
              placeholder="Enter your current password"
              autoComplete="current-password"
              aria-describedby={errors.currentPassword ? "current-error" : undefined}
              {...register("currentPassword")}
            />
            {errors.currentPassword && (
              <p id="current-error" role="alert" className="mt-1 text-xs text-red-500">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium">
              New password
            </label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Min 8 chars with uppercase, lowercase, number"
              autoComplete="new-password"
              aria-describedby={errors.newPassword ? "new-error" : undefined}
              {...register("newPassword")}
            />
            {errors.newPassword && (
              <p id="new-error" role="alert" className="mt-1 text-xs text-red-500">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium">
              Confirm new password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter your new password"
              autoComplete="new-password"
              aria-describedby={errors.confirmPassword ? "confirm-error" : undefined}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p id="confirm-error" role="alert" className="mt-1 text-xs text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        <Button className="mt-6 w-full" type="submit" disabled={loading}>
          {loading ? "Updating…" : "Update password"}
        </Button>
      </form>
    </main>
  );
}
