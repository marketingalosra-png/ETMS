"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function SettingsForm({ username, email, showUsername = true }: { username?: string | null; email?: string | null; showUsername?: boolean }) {
  const [form, setForm] = useState({ username: username ?? "", email: email ?? "", currentPassword: "", newPassword: "" });

  async function save() {
    const payload = {
      username: form.username || undefined,
      email: form.email || undefined,
      currentPassword: form.currentPassword || undefined,
      newPassword: form.newPassword || undefined
    };
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) return toast.error("Settings update failed");
    setForm((current) => ({ ...current, currentPassword: "", newPassword: "" }));
    toast.success("Settings saved");
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
      </CardHeader>
      <div className="grid gap-3">
        {showUsername ? <Input placeholder="Username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /> : null}
        <Input placeholder="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Current password" type="password" value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} />
          <Input placeholder="New password" type="password" value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} />
        </div>
        <Button className="w-fit" onClick={save}><Save className="h-4 w-4" />Save changes</Button>
      </div>
    </Card>
  );
}
