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

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "admin", password: "admin" }
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    const result = await signIn("credentials", { ...data, redirect: false });
    setLoading(false);
    if (result?.error) {
      toast.error("Invalid credentials or inactive account");
      return;
    }
    toast.success("Signed in securely");
    router.push("/launch");
  };

  return (
    <main className="grid min-h-screen overflow-hidden lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden items-center justify-center p-10 lg:flex">
        <div className="premium-grid absolute inset-0 opacity-70" />
        <motion.div className="relative max-w-xl" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1 text-sm text-muted-foreground backdrop-blur">
            <GraduationCap className="h-4 w-4 text-primary" />
            Enterprise learning command center
          </div>
          <h1 className="text-5xl font-bold leading-tight">Employee Training Management System</h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Track compliance, video progress, deadlines, and activity with a polished operational dashboard.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-3">
            {["95% auto completion", "Audit everything", "Role based access"].map((item) => (
              <div key={item} className="glass rounded-xl p-4 text-sm font-semibold">{item}</div>
            ))}
          </div>
        </motion.div>
      </section>
      <section className="flex items-center justify-center p-4 sm:p-8">
        <motion.form
          onSubmit={form.handleSubmit(onSubmit)}
          className="glass w-full max-w-md rounded-xl p-6 sm:p-8"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="mb-8">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-glow">
              <Lock className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-2xl font-bold">Sign in</h2>
            <p className="mt-1 text-sm text-muted-foreground">Use admin/admin for the first seeded admin login.</p>
          </div>
          <label className="mb-4 block">
            <span className="mb-2 flex items-center gap-2 text-sm font-medium"><Mail className="h-4 w-4" /> Employee ID or email</span>
            <Input {...form.register("identifier")} autoComplete="username" />
            {form.formState.errors.identifier ? <span className="mt-1 block text-xs text-red-500">{form.formState.errors.identifier.message}</span> : null}
          </label>
          <label className="mb-6 block">
            <span className="mb-2 flex items-center gap-2 text-sm font-medium"><Lock className="h-4 w-4" /> Password</span>
            <Input type="password" {...form.register("password")} autoComplete="current-password" />
            {form.formState.errors.password ? <span className="mt-1 block text-xs text-red-500">{form.formState.errors.password.message}</span> : null}
          </label>
          <Button className="w-full" disabled={loading}>{loading ? "Signing in..." : "Continue"}</Button>
        </motion.form>
      </section>
    </main>
  );
}
