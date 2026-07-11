import { AnimatedPage } from "@/components/animated-page";
import { MetricCard } from "@/components/metric-card";
import { TrainingCard } from "@/components/training-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireEmployeeOrAdmin } from "@/lib/session";
import { toIso } from "@/lib/dto";

export default async function EmployeeDashboardPage() {
  const session = await requireEmployeeOrAdmin();

  const employee = await prisma.employee.findUnique({
    where: { userId: session.user.id },
    include: {
      department: true,
      assignments: {
        include: { training: { include: { assets: true } } },
        orderBy: { dueDate: "asc" },
      },
    },
  });

  if (!employee) {
    return (
      <AnimatedPage>
        <div className="glass rounded-xl p-5">
          No employee profile is connected to this account.
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

  const average = employee.assignments.length
    ? employee.assignments.reduce((sum, a) => sum + a.progressPercent, 0) /
      employee.assignments.length
    : 0;

  return (
    <AnimatedPage>
      <div className="mb-6 grid gap-4 xl:grid-cols-[1fr_0.45fr]">
        <div>
          <p className="text-sm font-semibold text-primary">Welcome back</p>
          <h2 className="mt-1 text-3xl font-bold">{employee.fullName}</h2>
          <p className="mt-2 text-muted-foreground">
            {employee.jobTitle} · {employee.department?.name ?? "No department"}
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-xl bg-muted">
              {employee.photoUrl ? (
                <img
                  src={employee.photoUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div>
              <p className="font-semibold">{employee.employeeCode}</p>
              <p className="text-sm text-muted-foreground">
                Level {employee.level} · {employee.xp} XP
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Metric Cards — icons are string keys, all values are primitives */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Progress"
          value={`${Math.round(average)}%`}
          detail="Average across assigned courses"
          icon="timer"
        />
        <MetricCard
          title="Assigned"
          value={employee.assignments.length}
          detail="Total training courses"
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
          detail={`${late} overdue`}
          icon="clock"
        />
      </section>

      {/* Training Cards — dueDate converted to ISO string before passing */}
      <section className="mt-5 space-y-4">
        <h3 className="text-sm font-semibold">Assigned Trainings</h3>
        {employee.assignments.slice(0, 4).map((assignment) => (
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
      </section>
    </AnimatedPage>
  );
}
