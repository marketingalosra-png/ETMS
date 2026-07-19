import { AnimatedPage } from "@/components/animated-page";
import { MetricCard } from "@/components/metric-card";
import { TrainingCard } from "@/components/training-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { requireEmployeeOrAdmin } from "@/lib/session";
import { toIso } from "@/lib/dto";
import { GraduationCap } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";

export default async function EmployeeDashboardPage() {
  const session = await requireEmployeeOrAdmin();

  const employee = await prisma.employee.findUnique({
    where: { userId: session.user.id },
    include: {
      department: true,
      assignments: {
        include: { training: { include: { assets: true } } },
        orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      },
    },
  });

  if (!employee) {
    return (
      <AnimatedPage>
        <div className="glass rounded-xl p-8 text-center">
          <GraduationCap className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">No employee profile found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            No employee profile is linked to your account. Please contact your
            administrator.
          </p>
        </div>
      </AnimatedPage>
    );
  }

  // ---------------------------------------------------------------------------
  // Derived values — all plain numbers/strings, computed server-side
  // ---------------------------------------------------------------------------

  const completed = employee.assignments.filter((a) =>
    a.status.includes("COMPLETED")
  ).length;

  const remaining = employee.assignments.length - completed;

  const late = employee.assignments.filter(
    (a) =>
      (a.dueDate && a.dueDate < new Date() && !a.completedAt) ||
      a.status.includes("LATE")
  ).length;

  const inProgress = employee.assignments.filter(
    (a) => a.status === "IN_PROGRESS"
  ).length;

  const average = employee.assignments.length
    ? employee.assignments.reduce((sum, a) => sum + a.progressPercent, 0) /
      employee.assignments.length
    : 0;

  // Show urgent/in-progress/not-started first, limit to 6 on dashboard
  const priorityAssignments = employee.assignments
    .filter((a) => !a.status.includes("COMPLETED"))
    .slice(0, 6);

  const hasMore = employee.assignments.filter(
    (a) => !a.status.includes("COMPLETED")
  ).length > 6;

  return (
    <AnimatedPage>
      <div className="mb-6 grid gap-4 xl:grid-cols-[1fr_0.45fr]">
        <div>
          <p className="text-sm font-semibold text-primary">Welcome back</p>
          <h2 className="mt-1 text-3xl font-bold">{employee.fullName}</h2>
          <p className="mt-2 text-muted-foreground">
            {employee.jobTitle} ·{" "}
            {employee.department?.name ?? "No department"}
          </p>
          {late > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <Badge tone="red">
                {late} overdue assignment{late !== 1 ? "s" : ""}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Please complete them as soon as possible.
              </span>
            </div>
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
          </CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-xl bg-muted">
              {employee.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={employee.photoUrl}
                  alt={employee.fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center text-xl font-bold text-muted-foreground">
                  {employee.fullName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold">{employee.employeeCode}</p>
              <p className="text-sm text-muted-foreground">
                Level {employee.level} · {employee.xp} XP
              </p>
              <p className="text-xs text-muted-foreground">
                🔥 {employee.streakDays} day streak
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Metric Cards — icons are string keys, all values are primitives */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Avg Progress"
          value={`${Math.round(average)}%`}
          detail="Average across all courses"
          icon="timer"
        />
        <MetricCard
          title="In Progress"
          value={inProgress}
          detail="Currently active courses"
          icon="listChecks"
        />
        <MetricCard
          title="Completed"
          value={completed}
          detail="Finished trainings"
          icon="award"
        />
        <MetricCard
          title="Remaining"
          value={remaining}
          detail={late > 0 ? `${late} overdue` : "All on track"}
          icon="clock"
        />
      </section>

      {/* Training Cards */}
      <section className="mt-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            {priorityAssignments.length > 0
              ? "Active Trainings"
              : "All Trainings"}
          </h3>
          {employee.assignments.length > 0 && (
            <Link
              href="/employee/trainings"
              className="text-xs text-primary hover:underline"
            >
              View all ({employee.assignments.length})
            </Link>
          )}
        </div>

        {priorityAssignments.length === 0 && completed > 0 ? (
          <div className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-6 text-center">
            <p className="font-semibold text-teal-600 dark:text-teal-400">
              🎉 All trainings completed!
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Excellent work. Check back for new training assignments.
            </p>
          </div>
        ) : priorityAssignments.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No trainings assigned yet"
            description="You don't have any training courses assigned to your account right now. Check back later or contact your supervisor."
          />
        ) : (
          <>
            {priorityAssignments.map((assignment) => (
              <TrainingCard
                key={assignment.id}
                id={assignment.training.id}
                assignmentId={assignment.id}
                title={assignment.training.title}
                description={assignment.training.description}
                thumbnailUrl={assignment.training.thumbnailUrl}
                dueDate={toIso(assignment.dueDate)}
                progress={assignment.progressPercent}
                status={assignment.status}
              />
            ))}
            {hasMore && (
              <div className="text-center">
                <Link href="/employee/trainings">
                  <button className="text-sm text-primary hover:underline">
                    View all {employee.assignments.filter((a) => !a.status.includes("COMPLETED")).length} active trainings →
                  </button>
                </Link>
              </div>
            )}
          </>
        )}
      </section>
    </AnimatedPage>
  );
}
