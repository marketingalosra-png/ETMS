import { AnimatedPage } from "@/components/animated-page";
import { SettingsForm } from "@/components/settings-form";
import { requireAdmin } from "@/lib/session";

export default async function AdminSettingsPage() {
  const session = await requireAdmin();
  return (
    <AnimatedPage>
      <div className="mb-5">
        <p className="text-sm font-semibold text-primary">Settings</p>
        <h2 className="mt-1 text-3xl font-bold">Admin Account</h2>
        <p className="mt-2 text-muted-foreground">Update username, email, and password for the active admin account.</p>
      </div>
      <SettingsForm username={session.user.name} email={session.user.email} />
    </AnimatedPage>
  );
}
