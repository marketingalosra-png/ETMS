"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Edit3, Search, Trash2, UserMinus, UserPlus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import type { EmployeeDTO, DepartmentDTO } from "@/lib/dto";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import { FormField } from "@/components/ui/form-field";
import { EmptyState } from "@/components/ui/empty-state";
import { employeeSchema } from "@/lib/validation";

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
  joiningDate: null,
  birthDate: null,
  gender: "UNDISCLOSED",
  address: "",
  emergencyContact: "",
  notes: "",
  photoUrl: "",
  status: "ACTIVE",
};

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
      jobTitle: emp.jobTitle ?? "",
      manager: emp.manager ?? "",
      phone: emp.phone ?? "",
      nationalId: emp.nationalId ?? "",
      joiningDate: emp.joiningDate ? new Date(emp.joiningDate) : null,
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
    
    // Format dates to string/null to avoid serialization errors
    const bodyData = {
      ...input,
      joiningDate: input.joiningDate ? input.joiningDate.toISOString() : null,
      birthDate: input.birthDate ? input.birthDate.toISOString() : null,
    };

    const response = await fetch(url, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData),
    });
    
    if (!response.ok) {
      const errorMsg = await response.json().catch(() => ({}));
      toast.error(errorMsg.error ?? "Employee save failed");
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
    jobTitle: emp.jobTitle ?? "—",
    email: emp.user?.email ?? "",
    status: emp.status,
  }));

  const formErrors = form.formState.errors;

  return (
    <div className="grid gap-4 xl:grid-cols-[0.85fr_1.4fr]">
      <Card>
        <CardHeader>
          <CardTitle>{editing ? "Edit Employee" : "Add Employee"}</CardTitle>
        </CardHeader>
        <form className="grid gap-4 p-4 pt-0" onSubmit={form.handleSubmit(save)} noValidate>
          <FormField
            label="Full Name"
            htmlFor="fullName"
            required
            description="The employee's official full name."
            error={formErrors.fullName?.message}
          >
            <Input
              id="fullName"
              placeholder="e.g. John Doe"
              aria-required="true"
              {...form.register("fullName")}
            />
          </FormField>

          <FormField
            label="Employee ID"
            htmlFor="employeeCode"
            required
            description="Unique company employee identifier."
            error={formErrors.employeeCode?.message}
          >
            <Input
              id="employeeCode"
              placeholder="e.g. EMP-1001"
              aria-required="true"
              {...form.register("employeeCode")}
            />
          </FormField>

          <FormField
            label="Email Address"
            htmlFor="email"
            required
            description="Primary communication email address."
            error={formErrors.email?.message}
          >
            <Input
              id="email"
              type="email"
              placeholder="e.g. john.doe@company.com"
              aria-required="true"
              {...form.register("email")}
            />
          </FormField>

          <FormField
            label="Department"
            htmlFor="departmentId"
            description="Assigned organization department."
            error={formErrors.departmentId?.message}
          >
            <select
              id="departmentId"
              className="h-10 w-full rounded-lg border bg-card px-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              {...form.register("departmentId")}
            >
              <option value="">No department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Job Title"
            htmlFor="jobTitle"
            description="Official position or role title."
            error={formErrors.jobTitle?.message}
          >
            <Input
              id="jobTitle"
              placeholder="e.g. Software Engineer"
              {...form.register("jobTitle")}
            />
          </FormField>

          <FormField
            label="Phone Number"
            htmlFor="phone"
            description="Primary contact number."
            error={formErrors.phone?.message}
          >
            <Input
              id="phone"
              placeholder="e.g. +1 555-0199"
              {...form.register("phone")}
            />
          </FormField>

          <FormField
            label="Profile Photo URL"
            htmlFor="photoUrl"
            description="Web link to employee avatar picture."
            error={formErrors.photoUrl?.message}
          >
            <Input
              id="photoUrl"
              placeholder="e.g. https://domain.com/avatar.jpg"
              {...form.register("photoUrl")}
            />
          </FormField>

          <FormField
            label="Joining Date"
            htmlFor="joiningDate"
            description="Official start date at the company."
            error={formErrors.joiningDate?.message}
          >
            <Input
              id="joiningDate"
              type="date"
              {...form.register("joiningDate", {
                setValueAs: (v) => (v === "" ? null : new Date(v)),
              })}
            />
          </FormField>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1">
              <UserPlus className="h-4 w-4" />
              {editing ? "Save Changes" : "Add Employee"}
            </Button>
            {editing && (
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
            )}
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search employees by name, ID, email or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {tableRows.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No employees found"
            description="We couldn't find any employees matching your criteria. Try adjusting your search query or add a new employee."
            action={
              search
                ? { label: "Clear Search", onClick: () => setSearch("") }
                : undefined
            }
          />
        ) : (
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
                    title="Edit employee"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-9 w-9 px-0"
                    onClick={() => disable(emp)}
                    title={emp.status === "DEACTIVATED" ? "Activate employee" : "Deactivate employee"}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-9 w-9 px-0 text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteTarget(emp)}
                    title="Delete employee"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            }}
          />
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete employee?"
        description="This removes the employee, their login, assignments, and progress history. This action cannot be undone."
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
      />
    </div>
  );
}
