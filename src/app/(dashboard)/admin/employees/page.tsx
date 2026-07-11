import { AnimatedPage } from "@/components/animated-page";
import { EmployeeManager } from "@/components/admin/employee-manager";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { toEmployeeDTO, toDepartmentDTO } from "@/lib/dto";

export default async function EmployeesPage() {
  await requireAdmin();

  const [rawEmployees, rawDepartments] = await Promise.all([
    prisma.employee.findMany({
      include: { user: true, department: true, assignments: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
  ]);

  // Serialize to DTOs — no Prisma objects or Date instances cross the boundary
  const employees = rawEmployees.map(toEmployeeDTO);
  const departments = rawDepartments.map(toDepartmentDTO);

  return (
    <AnimatedPage>
      <div className="mb-5">
        <p className="text-sm font-semibold text-primary">People</p>
        <h2 className="mt-1 text-3xl font-bold">Employee Management</h2>
        <p className="mt-2 text-muted-foreground">
          Add, edit, disable, and remove employee profiles with secure login identities.
        </p>
      </div>
      <EmployeeManager initialEmployees={employees} departments={departments} />
    </AnimatedPage>
  );
}
