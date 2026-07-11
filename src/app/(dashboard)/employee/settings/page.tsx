import { AnimatedPage } from "@/components/animated-page";
import { SettingsForm } from "@/components/settings-form";
import { requireEmployeeOrAdmin } from "@/lib/session";

export default async function EmployeeSettingsPage() {
  const session = await requireEmployeeOrAdmin();
  return (
    <AnimatedPage>
      <div className="mb-5">
        <p className="text-sm font-semibold text-primary">Settings</p>
        <h2 className="mt-1 text-3xl font-bold">Account</h2>
        <p className="mt-2 text-muted-foreground">Update your email and password.</p>
      </div>
      <SettingsForm username={null} email={session.user.email} showUsername={false} />
    </AnimatedPage>
  );
}
