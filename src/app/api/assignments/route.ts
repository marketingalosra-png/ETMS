import { type NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { json, parseBody, withApiGuard } from "@/lib/api";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignmentSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  return withApiGuard(request, async () => {
    const session = await auth();
    const assignments = await prisma.assignment.findMany({
      where: session?.user.role === "EMPLOYEE" ? { employee: { userId: session.user.id } } : undefined,
      include: { employee: { include: { department: true, user: true } }, training: { include: { assets: true } } },
      orderBy: { createdAt: "desc" }
    });
    return json({ assignments });
  });
}

export async function POST(request: NextRequest) {
  return withApiGuard(request, async () => {
    const session = await auth();
    const input = await parseBody(request, assignmentSchema);
    const filters = [];
    if (input.employeeIds?.length) filters.push({ id: { in: input.employeeIds } });
    if (input.departmentIds?.length) filters.push({ departmentId: { in: input.departmentIds } });
    if (!input.everyone && filters.length === 0) return json({ error: "Choose employees, departments, or everyone" }, { status: 422 });
    const employees = await prisma.employee.findMany({
      where: input.everyone
        ? { status: "ACTIVE" }
        : { OR: filters }
    });
    const rows = employees.flatMap((employee) =>
      input.trainingIds.map((trainingId) => ({
        employeeId: employee.id,
        trainingId,
        assignedById: session?.user.id,
        dueDate: input.dueDate
      }))
    );
    await prisma.assignment.createMany({ data: rows, skipDuplicates: true });
    await audit({ userId: session?.user.id, actorName: session?.user.name ?? "Admin", action: "assignment.created", entity: "Assignment", metadata: { count: rows.length } });
    return json({ assigned: rows.length }, { status: 201 });
  }, { adminOnly: true });
}
