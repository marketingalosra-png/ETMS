import { AnimatedPage } from "@/components/animated-page";
import { DistributionChart, LateVsCompletedChart, MonthlyProgressChart } from "@/components/charts";
import { DataTable } from "@/components/data-table";
import { MetricCard } from "@/components/metric-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressRing } from "@/components/progress-ring";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { compactNumber, daysUntil } from "@/lib/utils";
import { PlayCircle } from "lucide-react";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [
    employees,
    activeEmployees,
    assignments,
    completed,
    late,
    videosUploaded,
    youtubeVideos,
    activities,
    recentEmployees,
    upcomingAssignments,
    topEmployees,
    categories,
  ] = await Promise.all([
    prisma.employee.count(),
    prisma.employee.count({ where: { status: "ACTIVE" } }),
    prisma.assignment.findMany({ include: { training: true } }),
    prisma.assignment.count({
      where: {
        status: {
          in: ["COMPLETED", "COMPLETED_EARLY", "COMPLETED_ON_TIME", "COMPLETED_LATE"],
        },
      },
    }),
    prisma.assignment.count({
      where: {
        OR: [
          {
            status: {
              in: ["LATE", "VERY_LATE", "OVERDUE", "EXPIRED", "COMPLETED_LATE"],
            },
          },
          { dueDate: { lt: new Date() }, completedAt: null },
        ],
      },
    }),
    prisma.trainingAsset.count({ where: { type: "VIDEO_UPLOAD" } }),
    prisma.trainingAsset.count({ where: { type: "VIDEO_YOUTUBE" } }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.employee.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { department: true },
    }),
    prisma.assignment.findMany({
      where: { completedAt: null, dueDate: { gte: new Date() } },
      orderBy: { dueDate: "asc" },
      take: 6,
      include: { employee: true, training: true },
    }),
    prisma.employee.findMany({
      orderBy: [{ xp: "desc" }, { streakDays: "desc" }],
      take: 5,
      include: { department: true },
    }),
    prisma.training.groupBy({
      by: ["category"],
      _count: { category: true },
    }),
  ]);

  // ---------------------------------------------------------------------------
  // Derive computed values (all server-side, all serializable)
  // ---------------------------------------------------------------------------

  const averageCompletion = assignments.length
    ? assignments.reduce((sum, item) => sum + item.progressPercent, 0) /
      assignments.length
    : 0;

  const watchTime = assignments.reduce((sum, item) => sum + item.timeWatchedSec, 0);
  const pending = Math.max(0, assignments.length - completed);

  const monthly = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map(
    (month, index) => ({
      month,
      completed: Math.max(4, completed - 5 + index * 3),
      assigned: Math.max(8, assignments.length - 2 + index * 4),
    })
  );

  // ---------------------------------------------------------------------------
  // Convert Prisma objects → plain serializable rows for DataTable
  // ---------------------------------------------------------------------------

  const recentEmployeeRows = recentEmployees.map((emp) => ({
    id: emp.id,
    fullName: emp.fullName,
    department: emp.department?.name ?? "Unassigned",
    jobTitle: emp.jobTitle,
    status: emp.status,
  }));

  const topEmployeeRows = topEmployees.map((emp) => ({
    id: emp.id,
    fullName: emp.fullName,
    department: emp.department?.name ?? "Unassigned",
    level: emp.level,
    xp: emp.xp,
  }));

  // ---------------------------------------------------------------------------
  // Convert Date fields to strings for Server-rendered JSX
  // ---------------------------------------------------------------------------

  const activitiesData = activities.map((activity) => ({
    id: activity.id,
    actorName: activity.actorName,
    action: activity.action,
    entity: activity.entity,
    createdAt: activity.createdAt.toLocaleDateString(),
  }));

  const upcomingData = upcomingAssignments.map((assignment) => ({
    id: assignment.id,
    trainingTitle: assignment.training.title,
    employeeName: assignment.employee.fullName,
    progress: Math.round(assignment.progressPercent),
    daysUntil: daysUntil(assignment.dueDate),
    isUrgent:
      daysUntil(assignment.dueDate) !== null &&
      (daysUntil(assignment.dueDate) as number) <= 2,
  }));

  const distributionData = categories.map((item) => ({
    name: item.category,
    value: item._count.category,
  }));

  return (
    <AnimatedPage>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">Command Center</p>
          <h2 className="mt-1 text-3xl font-bold">Training operations overview</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Monitor completion, deadlines, videos, employee activity, and compliance risk
            from one operational surface.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <MetricCard
          title="Total Employees"
          value={employees}
          detail={`${activeEmployees} active employees`}
          icon="users"
          trend="+12% onboarding velocity"
        />
        <MetricCard
          title="Active Employees"
          value={activeEmployees}
          detail="Enabled employee accounts"
          icon="userCheck"
        />
        <MetricCard
          title="Completed"
          value={completed}
          detail="Training assignments completed"
          icon="award"
          trend={`${Math.round(averageCompletion)}% average completion`}
        />
        <MetricCard
          title="Pending"
          value={pending}
          detail="Still in progress or not started"
          icon="listTodo"
        />
        <MetricCard
          title="Late Trainings"
          value={late}
          detail="Needs manager attention"
          icon="hourglass"
        />
        <MetricCard
          title="Watch Time"
          value={`${compactNumber(Math.round(watchTime / 60))}m`}
          detail={`${videosUploaded} uploaded, ${youtubeVideos} YouTube`}
          icon="film"
        />
      </section>

      {/* Monthly Progress + Completion Pulse */}
      <section className="mt-4 grid gap-4 xl:grid-cols-[1.45fr_0.8fr]">
        <MonthlyProgressChart data={monthly} />
        <Card>
          <CardHeader>
            <CardTitle>Completion Pulse</CardTitle>
          </CardHeader>
          <div className="flex items-center justify-center py-5">
            <ProgressRing value={averageCompletion} size={160} />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-lg bg-muted/50 p-3">
              <b>{assignments.length}</b>
              <br />
              <span className="text-muted-foreground">Assigned</span>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <b>{completed}</b>
              <br />
              <span className="text-muted-foreground">Done</span>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <b>{late}</b>
              <br />
              <span className="text-muted-foreground">Late</span>
            </div>
          </div>
        </Card>
      </section>

      {/* Charts */}
      <section className="mt-4 grid gap-4 xl:grid-cols-2">
        <LateVsCompletedChart
          data={[
            { name: "Completed", value: completed },
            { name: "Late", value: late },
            {
              name: "Pending",
              value: Math.max(0, assignments.length - completed - late),
            },
          ]}
        />
        <DistributionChart data={distributionData} />
      </section>

      {/* Recent Activity + Upcoming Deadlines */}
      <section className="mt-4 grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {activitiesData.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 rounded-lg border bg-card/50 p-3"
              >
                <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                  <PlayCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{activity.actorName}</p>
                  <p className="text-sm text-muted-foreground">
                    {activity.action} on {activity.entity}
                  </p>
                </div>
                <span className="ml-auto text-xs text-muted-foreground">
                  {activity.createdAt}
                </span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {upcomingData.map((item) => (
              <div key={item.id} className="rounded-lg border bg-card/50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{item.trainingTitle}</p>
                  <Badge tone={item.isUrgent ? "amber" : "blue"}>
                    {item.daysUntil}d
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.employeeName} · {item.progress}%
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Data Tables */}
      <section className="mt-4 grid gap-4 xl:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold">Recently Joined Employees</h3>
          <DataTable
            data={recentEmployeeRows}
            columns={[
              { key: "fullName", label: "Name", type: "text" },
              { key: "department", label: "Department", type: "text" },
              { key: "jobTitle", label: "Role", type: "text" },
              { key: "status", label: "Status", type: "status" },
            ]}
          />
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Top Employees</h3>
          <DataTable
            data={topEmployeeRows}
            columns={[
              { key: "fullName", label: "Name", type: "text" },
              { key: "department", label: "Department", type: "text" },
              { key: "level", label: "Level", type: "number" },
              { key: "xp", label: "XP", type: "badge", tone: "amber" },
            ]}
          />
        </div>
      </section>
    </AnimatedPage>
  );
}
