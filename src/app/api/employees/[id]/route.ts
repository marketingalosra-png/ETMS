import { type NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { json, parseBody, withApiGuard } from "@/lib/api";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { employeeSchema } from "@/lib/validation";
import { toEmployeeDTO } from "@/lib/dto";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiGuard(
    request,
    async () => {
      const { id } = await params;
      const employee = await prisma.employee.findUnique({
        where: { id },
        include: { user: true, department: true, assignments: true },
      });
      if (!employee) return json({ error: "Employee not found" }, { status: 404 });
      return json({ employee: toEmployeeDTO(employee) });
    },
    { adminOnly: true }
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiGuard(
    request,
    async () => {
      const session = await auth();
      const { id } = await params;
      const input = await parseBody(request, employeeSchema.partial());

      // Validate employee exists first
      const existing = await prisma.employee.findUnique({ where: { id } });
      if (!existing) return json({ error: "Employee not found" }, { status: 404 });

      const employee = await prisma.employee.update({
        where: { id },
        data: {
          department:
            input.departmentId === undefined
              ? undefined
              : !input.departmentId || input.departmentId.trim() === ""
                ? { disconnect: true }
                : { connect: { id: input.departmentId } },
          fullName: input.fullName,
          employeeCode: input.employeeCode,
          jobTitle: input.jobTitle === null ? "" : input.jobTitle,
          manager: input.manager,
          phone: input.phone,
          nationalId: input.nationalId,
          joiningDate: input.joiningDate === null ? undefined : input.joiningDate,
          birthDate: input.birthDate,
          gender: input.gender,
          address: input.address,
          emergencyContact: input.emergencyContact,
          notes: input.notes,
          photoUrl: input.photoUrl,
          status: input.status,
          user: {
            update: {
              email: input.email,
              employeeId: input.employeeCode,
              isActive:
                input.status !== undefined
                  ? input.status !== "DEACTIVATED"
                  : undefined,
            },
          },
        },
        include: { user: true, department: true, assignments: true },
      });

      await audit({
        userId: session?.user.id,
        actorName: session?.user.name ?? "Admin",
        action: "employee.updated",
        entity: "Employee",
        entityId: employee.id,
        metadata: { employeeCode: employee.employeeCode },
      });
      return json({ employee: toEmployeeDTO(employee) });
    },
    { adminOnly: true }
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiGuard(
    request,
    async () => {
      const session = await auth();
      const { id } = await params;

      // Validate employee exists before deleting
      const existing = await prisma.employee.findUnique({ where: { id } });
      if (!existing) return json({ error: "Employee not found" }, { status: 404 });

      await prisma.employee.delete({ where: { id } });
      await audit({
        userId: session?.user.id,
        actorName: session?.user.name ?? "Admin",
        action: "employee.deleted",
        entity: "Employee",
        entityId: id,
        metadata: { employeeCode: existing.employeeCode, fullName: existing.fullName },
      });
      return json({ ok: true });
    },
    { adminOnly: true }
  );
}
