"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Edit3, Search, Trash2, UserMinus, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import type { EmployeeDTO, DepartmentDTO } from "@/lib/dto";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table";
import { employeeSchema } from "@/lib/validation";

// ---------------------------------------------------------------------------
// Types — uses DTO types instead of raw Prisma types
// ---------------------------------------------------------------------------

type FormInput = z.infer<typeof employeeSchema>;

const defaults: FormInput = {
  fullName: "",
  employeeCode: "",
  email: "",
  departmentId: "",
  jobTitle: "",
  manager: "",
  phone: "",
  nationalId: "",
  joiningDate: new Date(),
  birthDate: null,
  gender: "UNDISCLOSED",
  address: "",
  emergencyContact: "",
  notes: "",
  photoUrl: "",
  status: "ACTIVE",
};

// ---------------------------------------------------------------------------
// EmployeeManager — Client Component
// Receives plain DTO objects from Server Components (all fields are serializable)
// ---------------------------------------------------------------------------

export function EmployeeManager({
  initialEmployees,
  departments,
}: {
  initialEmployees: EmployeeDTO[];
  departments: DepartmentDTO[];
}) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<EmployeeDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmployeeDTO | null>(null);
  const form = useForm<FormInput>({
    resolver: zodResolver(employeeSchema),
    defaultValues: defaults,
  });

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return employees.filter((emp) =>
      [emp.fullName, emp.employeeCode, emp.user?.email, emp.department?.name].some(
        (v) => v?.toLowerCase().includes(term)
      )
    );
  }, [employees, search]);

  function edit(emp: EmployeeDTO) {
    setEditing(emp);
    form.reset({
      fullName: emp.fullName,
      employeeCode: emp.employeeCode,
      email: emp.user?.email ?? "",
      departmentId: emp.departmentId ?? "",
      jobTitle: emp.jobTitle,
      manager: emp.manager ?? "",
      phone: emp.phone ?? "",
      nationalId: emp.nationalId ?? "",
      // joiningDate stored as ISO string — parse back to Date for the form
      joiningDate: new Date(emp.joiningDate),
      birthDate: emp.birthDate ? new Date(emp.birthDate) : null,
      gender: emp.gender as FormInput["gender"],
      address: emp.address ?? "",
      emergencyContact: emp.emergencyContact ?? "",
      notes: emp.notes ?? "",
      photoUrl: emp.photoUrl ?? "",
      status: emp.status as FormInput["status"],
    });
  }

  async function save(input: FormInput) {
    const url = editing ? `/api/employees/${editing.id}` : "/api/employees";
    const response = await fetch(url, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      toast.error("Employee save failed");
      return;
    }
    const payload = (await response.json()) as { employee: EmployeeDTO };
    setEmployees((current) =>
      editing
        ? current.map((item) =>
            item.id === payload.employee.id
              ? { ...payload.employee, assignments: item.assignments }
              : item
          )
        : [payload.employee, ...current]
    );
    form.reset(defaults);
    setEditing(null);
    toast.success(editing ? "Employee updated" : "Employee added");
  }

  async function disable(emp: EmployeeDTO) {
    const response = await fetch(`/api/employees/${emp.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: emp.status === "DEACTIVATED" ? "ACTIVE" : "DEACTIVATED",
      }),
    });
    if (!response.ok) return toast.error("Status update failed");
    const payload = (await response.json()) as { employee: EmployeeDTO };
    setEmployees((current) =>
      current.map((item) =>
        item.id === payload.employee.id ? { ...item, ...payload.employee } : item
      )
    );
    toast.success(
      emp.status === "DEACTIVATED" ? "Employee activated" : "Employee disabled"
    );
  }

  async function remove() {
    if (!deleteTarget) return;
    const response = await fetch(`/api/employees/${deleteTarget.id}`, {
      method: "DELETE",
    });
    if (!response.ok) return toast.error("Delete failed");
    setEmployees((current) => current.filter((item) => item.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast.success("Employee deleted");
  }

  // Serializable rows for DataTable
  type EmployeeRow = {
    id: string;
    fullName: string;
    employeeCode: string;
    department: string;
    jobTitle: string;
    email: string;
    status: string;
  };

  const tableRows: EmployeeRow[] = filtered.map((emp) => ({
    id: emp.id,
    fullName: emp.fullName,
    employeeCode: emp.employeeCode,
    department: emp.department?.name ?? "Unassigned",
    jobTitle: emp.jobTitle,
    email: emp.user?.email ?? "",
    status: emp.status,
  }));

  return (
    <div className="grid gap-4 xl:grid-cols-[0.85fr_1.4fr]">
      <Card>
        <CardHeader>
          <CardTitle>{editing ? "Edit Employee" : "Add Employee"}</CardTitle>
        </CardHeader>
        <form className="grid gap-3" onSubmit={form.handleSubmit(save)}>
          <Input placeholder="Full name" {...form.register("fullName")} />
          <Input placeholder="Employee ID" {...form.register("employeeCode")} />
          <Input placeholder="Email" type="email" {...form.register("email")} />
          <select
            className="h-10 rounded-lg border bg-card px-3 text-sm"
            {...form.register("departmentId")}
          >
            <option value="">No department</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
          <Input placeholder="Job title" {...form.register("jobTitle")} />
          <Input placeholder="Phone" {...form.register("phone")} />
          <Input placeholder="Profile photo URL" {...form.register("photoUrl")} />
          <Input
            type="date"
            {...form.register("joiningDate", { valueAsDate: true })}
          />
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              <UserPlus className="h-4 w-4" />
              {editing ? "Save" : "Add"}
            </Button>
            {editing ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditing(null);
                  form.reset(defaults);
                }}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <DataTable
          data={tableRows}
          columns={[
            { key: "fullName", label: "Employee", type: "text" },
            { key: "department", label: "Department", type: "text" },
            { key: "jobTitle", label: "Job Title", type: "text" },
            { key: "email", label: "Email", type: "text" },
            { key: "status", label: "Status", type: "status" },
          ]}
          renderActions={(row) => {
            const emp = employees.find((e) => e.id === row.id);
            if (!emp) return null;
            return (
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  className="h-9 w-9 px-0"
                  onClick={() => edit(emp)}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  className="h-9 w-9 px-0"
                  onClick={() => disable(emp)}
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  className="h-9 w-9 px-0"
                  onClick={() => setDeleteTarget(emp)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          }}
        />
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete employee?"
        description="This removes the employee, their login, assignments, and progress history."
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
      />
    </div>
  );
}
