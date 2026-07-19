"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { GraduationCap, Lock, Mail } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginSchema } from "@/lib/validation";

type LoginInput = z.infer<typeof loginSchema>;

const features = [
  {
    title: "Smart progress tracking",
    detail: "Videos save progress automatically every 10 seconds",
  },
  {
    title: "Role-based access",
    detail: "Admins manage; employees learn at their own pace",
  },
  {
    title: "Full audit trail",
    detail: "Every action is logged for compliance reporting",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    const result = await signIn("credentials", { ...data, redirect: false });
    setLoading(false);
    if (result?.error) {
      toast.error("Invalid credentials or inactive account. Please try again.");
      form.setError("password", {
        type: "manual",
        message: "Invalid credentials",
      });
      return;
    }
    toast.success("Signed in successfully");
    router.push("/launch");
  };

  return (
    <main className="grid min-h-screen overflow-hidden lg:grid-cols-[1.05fr_0.95fr]">
      {/* Left panel – branding */}
      <section className="relative hidden items-center justify-center p-10 lg:flex">
        <div className="premium-grid absolute inset-0 opacity-70" />
        <motion.div
          className="relative max-w-xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1 text-sm text-muted-foreground backdrop-blur">
            <GraduationCap className="h-4 w-4 text-primary" />
            Enterprise learning command center
          </div>
          <h1 className="text-5xl font-bold leading-tight">
            Employee Training Management System
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Track compliance, video progress, deadlines, and activity with a
            polished operational dashboard.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {features.map((item) => (
              <div key={item.title} className="glass rounded-xl p-4">
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Right panel – login form */}
      <section className="flex items-center justify-center p-4 sm:p-8">
        <motion.form
          onSubmit={form.handleSubmit(onSubmit)}
          className="glass w-full max-w-md rounded-xl p-6 sm:p-8"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          noValidate
        >
          <div className="mb-8">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-glow">
              <Lock className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-2xl font-bold">Sign in to ETMS</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your employee ID, username, or email address.
            </p>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Mail className="h-4 w-4" /> Employee ID or email
              </span>
              <Input
                {...form.register("identifier")}
                autoComplete="username"
                aria-label="Employee ID or email"
                placeholder="e.g. EMP-1001 or name@company.com"
              />
              {form.formState.errors.identifier && (
                <span className="mt-1 block text-xs text-red-500" role="alert">
                  {form.formState.errors.identifier.message}
                </span>
              )}
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Lock className="h-4 w-4" /> Password
              </span>
              <Input
                type="password"
                {...form.register("password")}
                autoComplete="current-password"
                aria-label="Password"
                placeholder="Enter your password"
              />
              {form.formState.errors.password && (
                <span className="mt-1 block text-xs text-red-500" role="alert">
                  {form.formState.errors.password.message}
                </span>
              )}
            </label>
          </div>

          <Button className="mt-6 w-full" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Continue"}
          </Button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Default admin credentials: <strong>admin</strong> /&nbsp;
            <strong>admin</strong> (change after first login)
          </p>
        </motion.form>
      </section>
    </main>
  );
}
