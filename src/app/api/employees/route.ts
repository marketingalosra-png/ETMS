import { type NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { audit } from "@/lib/audit";
import { json, parseBody, withApiGuard } from "@/lib/api";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { employeeSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  return withApiGuard(request, async () => {
    const search = request.nextUrl.searchParams.get("search") ?? "";
    const employees = await prisma.employee.findMany({
      where: search
        ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" } },
              { employeeCode: { contains: search, mode: "insensitive" } },
              { user: { email: { contains: search, mode: "insensitive" } } }
            ]
          }
        : undefined,
      include: { user: true, department: true, assignments: true },
      orderBy: { createdAt: "desc" }
    });
    return json({ employees });
  }, { adminOnly: true });
}

export async function POST(request: NextRequest) {
  return withApiGuard(request, async () => {
    const input = await parseBody(request, employeeSchema);
    const employee = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          employeeId: input.employeeCode,
          username: input.employeeCode.toLowerCase(),
          role: Role.EMPLOYEE,
          passwordHash: await hashPassword("Password123!")
        }
      });
      return tx.employee.create({
        data: {
          userId: user.id,
          departmentId: input.departmentId,
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
          status: input.status
        },
        include: { user: true, department: true, assignments: true }
      });
    });
    await audit({ actorName: "Admin", action: "employee.created", entity: "Employee", entityId: employee.id, metadata: { employeeCode: employee.employeeCode } });
    return json({ employee }, { status: 201 });
  }, { adminOnly: true });
}
