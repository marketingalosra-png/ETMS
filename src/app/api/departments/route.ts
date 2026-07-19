import { type NextRequest } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { json, parseBody, withApiGuard } from "@/lib/api";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toDepartmentDTO } from "@/lib/dto";

const departmentSchema = z.object({
  name: z.string().min(2, "Department name must be at least 2 characters"),
  description: z
    .string()
    .nullish()
    .transform((v) => (v === "" ? null : v)),
  managerName: z
    .string()
    .nullish()
    .transform((v) => (v === "" ? null : v)),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a valid hex code (e.g. #2563eb)")
    .default("#2563eb"),
});

export async function GET(request: NextRequest) {
  return withApiGuard(request, async () => {
    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
    });
    return json({ departments: departments.map(toDepartmentDTO) });
  });
}

export async function POST(request: NextRequest) {
  return withApiGuard(
    request,
    async () => {
      const session = await auth();
      const input = await parseBody(request, departmentSchema);

      // Check for duplicate name
      const existing = await prisma.department.findFirst({
        where: { name: { equals: input.name, mode: "insensitive" } },
      });
      if (existing) {
        return json(
          { error: `A department named "${existing.name}" already exists` },
          { status: 409 }
        );
      }

      const department = await prisma.department.create({
        data: {
          name: input.name,
          description: input.description,
          managerName: input.managerName,
          color: input.color,
        },
      });

      await audit({
        userId: session?.user.id,
        actorName: session?.user.name ?? "Admin",
        action: "department.created",
        entity: "Department",
        entityId: department.id,
        metadata: { name: department.name },
      });
      return json({ department: toDepartmentDTO(department) }, { status: 201 });
    },
    { adminOnly: true }
  );
}
