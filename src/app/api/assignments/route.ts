import { type NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { json, parseBody, withApiGuard } from "@/lib/api";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toAssignmentDTO } from "@/lib/dto";
import { assignmentSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  return withApiGuard(request, async () => {
    const session = await auth();
    const assignments = await prisma.assignment.findMany({
      where:
        session?.user.role === "EMPLOYEE"
          ? { employee: { userId: session.user.id } }
          : undefined,
      include: {
        employee: { include: { department: true, user: true } },
        training: { include: { assets: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return json({ assignments: assignments.map(toAssignmentDTO) });
  });
}

export async function POST(request: NextRequest) {
  return withApiGuard(
    request,
    async () => {
      const session = await auth();
      const input = await parseBody(request, assignmentSchema);
      const filters = [];
      if (input.employeeIds?.length)
        filters.push({ id: { in: input.employeeIds } });
      if (input.departmentIds?.length)
        filters.push({ departmentId: { in: input.departmentIds } });
      if (!input.everyone && filters.length === 0) {
        return json(
          { error: "Choose at least one employee, department, or everyone" },
          { status: 422 }
        );
      }

      const employees = await prisma.employee.findMany({
        where: input.everyone ? { status: "ACTIVE" } : { OR: filters },
      });

      if (employees.length === 0) {
        return json(
          { error: "No matching active employees found" },
          { status: 422 }
        );
      }

      const rows = employees.flatMap((employee) =>
        input.trainingIds.map((trainingId) => ({
          employeeId: employee.id,
          trainingId,
          assignedById: session?.user.id,
          dueDate: input.dueDate,
        }))
      );

      await prisma.assignment.createMany({ data: rows, skipDuplicates: true });
      await audit({
        userId: session?.user.id,
        actorName: session?.user.name ?? "Admin",
        action: "assignment.created",
        entity: "Assignment",
        metadata: {
          count: rows.length,
          trainingCount: input.trainingIds.length,
          employeeCount: employees.length,
        },
      });
      return json({ assigned: rows.length }, { status: 201 });
    },
    { adminOnly: true }
  );
}
