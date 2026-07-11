import { AnimatedPage } from "@/components/animated-page";
import { AssignmentManager } from "@/components/admin/assignment-manager";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { toEmployeeDTO, toTrainingDTO, toAssignmentDTO } from "@/lib/dto";

export default async function AssignmentsPage() {
  await requireAdmin();

  const [rawEmployees, rawTrainings, rawAssignments] = await Promise.all([
    prisma.employee.findMany({
      where: { status: "ACTIVE" },
      include: { user: true, department: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.training.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { title: "asc" },
    }),
    prisma.assignment.findMany({
      include: {
        employee: { include: { user: true, department: true } },
        training: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Serialize to DTOs — no Prisma objects or Date instances cross the boundary
  const employees = rawEmployees.map(toEmployeeDTO);
  const trainings = rawTrainings.map(toTrainingDTO);
  const assignments = rawAssignments.map(toAssignmentDTO);

  return (
    <AnimatedPage>
      <div className="mb-5">
        <p className="text-sm font-semibold text-primary">Assignments</p>
        <h2 className="mt-1 text-3xl font-bold">Assign Training</h2>
        <p className="mt-2 text-muted-foreground">
          Assign one or more trainings to selected employees and track deadline status
          clearly.
        </p>
      </div>
      <AssignmentManager
        employees={employees}
        trainings={trainings}
        initialAssignments={assignments}
      />
    </AnimatedPage>
  );
}
