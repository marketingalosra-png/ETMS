import { type NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { json, parseBody, withApiGuard } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { employeeSchema } from "@/lib/validation";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiGuard(request, async () => {
    const { id } = await params;
    const input = await parseBody(request, employeeSchema.partial());
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        department: input.departmentId === undefined
          ? undefined
          : input.departmentId === null
            ? { disconnect: true }
            : { connect: { id: input.departmentId } },
        fullName: input.fullName,
        employeeCode: input.employeeCode,
        jobTitle: input.jobTitle,
        manager: input.manager,
        phone: input.phone,
        nationalId: input.nationalId,
        joiningDate: input.joiningDate,
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
            isActive: input.status ? input.status !== "DEACTIVATED" : undefined
          }
        }
      },
      include: { user: true, department: true, assignments: true }
    });
    await audit({ actorName: "Admin", action: "employee.updated", entity: "Employee", entityId: employee.id });
    return json({ employee });
  }, { adminOnly: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiGuard(request, async () => {
    const { id } = await params;
    const employee = await prisma.employee.delete({ where: { id } });
    await audit({ actorName: "Admin", action: "employee.deleted", entity: "Employee", entityId: id });
    return json({ employee });
  }, { adminOnly: true });
}
