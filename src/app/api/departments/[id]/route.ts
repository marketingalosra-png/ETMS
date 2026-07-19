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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiGuard(request, async () => {
    const { id } = await params;
    const department = await prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { employees: true } } },
    });
    if (!department) {
      return json({ error: "Department not found" }, { status: 404 });
    }
    return json({ department: toDepartmentDTO(department) });
  });
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
      const input = await parseBody(request, departmentSchema.partial());

      const existing = await prisma.department.findUnique({ where: { id } });
      if (!existing) {
        return json({ error: "Department not found" }, { status: 404 });
      }

      // Check duplicate name if changing name
      if (input.name && input.name !== existing.name) {
        const duplicate = await prisma.department.findFirst({
          where: {
            name: { equals: input.name, mode: "insensitive" },
            id: { not: id },
          },
        });
        if (duplicate) {
          return json(
            { error: `A department named "${duplicate.name}" already exists` },
            { status: 409 }
          );
        }
      }

      const department = await prisma.department.update({
        where: { id },
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
        action: "department.updated",
        entity: "Department",
        entityId: department.id,
        metadata: { name: department.name },
      });
      return json({ department: toDepartmentDTO(department) });
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

      const existing = await prisma.department.findUnique({
        where: { id },
        include: { _count: { select: { employees: true } } },
      });
      if (!existing) {
        return json({ error: "Department not found" }, { status: 404 });
      }

      // Warn if department has employees (still allow delete — employees become unassigned)
      await prisma.department.delete({ where: { id } });

      await audit({
        userId: session?.user.id,
        actorName: session?.user.name ?? "Admin",
        action: "department.deleted",
        entity: "Department",
        entityId: id,
        metadata: {
          name: existing.name,
          employeeCount: existing._count.employees,
        },
      });
      return json({ ok: true });
    },
    { adminOnly: true }
  );
}
