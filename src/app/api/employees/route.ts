import { type NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { audit } from "@/lib/audit";
import { json, parseBody, withApiGuard } from "@/lib/api";
import { auth } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { toEmployeeDTO } from "@/lib/dto";
import { employeeSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  return withApiGuard(
    request,
    async () => {
      const { searchParams } = request.nextUrl;
      const search = searchParams.get("search") ?? "";
      const status = searchParams.get("status");
      const departmentId = searchParams.get("departmentId");

      const employees = await prisma.employee.findMany({
        where: {
          ...(search
            ? {
                OR: [
                  { fullName: { contains: search, mode: "insensitive" } },
                  { employeeCode: { contains: search, mode: "insensitive" } },
                  {
                    user: {
                      email: { contains: search, mode: "insensitive" },
                    },
                  },
                ],
              }
            : {}),
          ...(status ? { status: status as "ACTIVE" | "INACTIVE" | "DEACTIVATED" } : {}),
          ...(departmentId ? { departmentId } : {}),
        },
        include: { user: true, department: true, assignments: true },
        orderBy: { createdAt: "desc" },
      });
      return json({ employees: employees.map(toEmployeeDTO) });
    },
    { adminOnly: true }
  );
}

export async function POST(request: NextRequest) {
  return withApiGuard(
    request,
    async () => {
      const session = await auth();
      const input = await parseBody(request, employeeSchema);

      // Check for duplicate employeeCode
      const existing = await prisma.employee.findFirst({
        where: {
          OR: [
            { employeeCode: { equals: input.employeeCode, mode: "insensitive" } },
            {
              user: {
                email: { equals: input.email, mode: "insensitive" },
              },
            },
          ],
        },
      });
      if (existing) {
        return json(
          {
            error:
              existing.employeeCode.toLowerCase() ===
              input.employeeCode.toLowerCase()
                ? `An employee with code "${input.employeeCode}" already exists`
                : `An employee with email "${input.email}" already exists`,
          },
          { status: 409 }
        );
      }

      const employee = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: input.email,
            employeeId: input.employeeCode,
            username: input.employeeCode.toLowerCase(),
            role: Role.EMPLOYEE,
            passwordHash: await hashPassword("Password123!"),
            mustChangePassword: true,
          },
        });
        return tx.employee.create({
          data: {
            userId: user.id,
            departmentId:
              input.departmentId && input.departmentId.trim() !== ""
                ? input.departmentId
                : null,
            fullName: input.fullName,
            employeeCode: input.employeeCode,
            jobTitle: input.jobTitle ?? "",
            manager: input.manager,
            phone: input.phone,
            nationalId: input.nationalId,
            joiningDate: input.joiningDate ?? new Date(),
            birthDate: input.birthDate,
            gender: input.gender,
            address: input.address,
            emergencyContact: input.emergencyContact,
            notes: input.notes,
            photoUrl: input.photoUrl,
            status: input.status,
          },
          include: { user: true, department: true, assignments: true },
        });
      });

      await audit({
        userId: session?.user.id,
        actorName: session?.user.name ?? "Admin",
        action: "employee.created",
        entity: "Employee",
        entityId: employee.id,
        metadata: {
          employeeCode: employee.employeeCode,
          fullName: employee.fullName,
        },
      });
      return json({ employee: toEmployeeDTO(employee) }, { status: 201 });
    },
    { adminOnly: true }
  );
}
