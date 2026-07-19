"use client";

import { Send, Users, GraduationCap, ClipboardList, Trash2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { EmployeeDTO, TrainingDTO, AssignmentDTO } from "@/lib/dto";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function AssignmentManager({
  employees,
  trainings,
  initialAssignments,
}: {
  employees: EmployeeDTO[];
  trainings: TrainingDTO[];
  initialAssignments: AssignmentDTO[];
}) {
  const [employeeIds, setEmployeeIds] = useState<string[]>([]);
  const [trainingIds, setTrainingIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [assignments, setAssignments] = useState(initialAssignments);
  const [isAssigning, setIsAssigning] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AssignmentDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function toggle(
    list: string[],
    value: string,
    setter: (next: string[]) => void
  ) {
    setter(
      list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value]
    );
  }

  async function assign() {
    if (!employeeIds.length || !trainingIds.length) {
      toast.error("Choose at least one employee and one training");
      return;
    }
    setIsAssigning(true);
    try {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeIds,
          trainingIds,
          everyone: false,
          dueDate: dueDate || null,
        }),
      });
      if (!response.ok) {
        const err = (await response.json()) as { error?: string };
        toast.error(err.error ?? "Assignment failed");
        return;
      }
      const payload = (await response.json()) as { assigned: number };
      // Refresh the assignment list
      const fresh = (await fetch("/api/assignments").then((r) =>
        r.json()
      )) as { assignments: AssignmentDTO[] };
      setAssignments(fresh.assignments);
      setEmployeeIds([]);
      setTrainingIds([]);
      setDueDate("");
      toast.success(
        `${payload.assigned} training assignment${payload.assigned !== 1 ? "s" : ""} created successfully`
      );
    } finally {
      setIsAssigning(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/assignments/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const err = (await response.json()) as { error?: string };
        toast.error(err.error ?? "Failed to delete assignment");
        return;
      }
      setAssignments((current) =>
        current.filter((a) => a.id !== deleteTarget.id)
      );
      setDeleteTarget(null);
      toast.success("Assignment deleted");
    } finally {
      setIsDeleting(false);
    }
  }

  type AssignmentRow = {
    id: string;
    employee: string;
    employeeCode: string;
    training: string;
    progress: number;
    dueDate: string;
    status: string;
    isCompleted: boolean;
  };

  const tableRows: AssignmentRow[] = assignments.map((a) => {
    const isOverdue =
      a.dueDate &&
      new Date(a.dueDate) < new Date() &&
      !a.completedAt;
    const isCompleted = Boolean(a.completedAt);
    return {
      id: a.id,
      employee: a.employee?.fullName ?? "—",
      employeeCode: a.employee?.employeeCode ?? "—",
      training: a.training?.title ?? "—",
      progress: Math.round(a.progressPercent),
      dueDate: a.dueDate ?? "",
      status: isOverdue ? "OVERDUE" : a.status,
      isCompleted,
    };
  });

  return (
    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.35fr]">
      <Card>
        <CardHeader>
          <CardTitle>Assign Trainings</CardTitle>
        </CardHeader>
        <div className="space-y-5 p-4 pt-0">
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Select Employees *</span>
              <span className="text-xs text-muted-foreground">
                {employeeIds.length} selected
              </span>
            </div>
            {employees.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No active employees"
                description="There are no active employees available to assign training to."
              />
            ) : (
              <div className="max-h-60 space-y-2 overflow-y-auto rounded-lg border bg-card/20 p-2 pr-1">
                {employees.map((emp) => (
                  <label
                    key={emp.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border bg-card/50 p-2.5 text-sm transition hover:bg-muted/40"
                  >
                    <input
                      type="checkbox"
                      className="rounded accent-primary"
                      checked={employeeIds.includes(emp.id)}
                      onChange={() => toggle(employeeIds, emp.id, setEmployeeIds)}
                    />
                    <div>
                      <p className="text-xs font-medium leading-none">
                        {emp.fullName}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {emp.employeeCode}
                      </p>
                    </div>
                    <span className="ml-auto rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {emp.department?.name ?? "No dept"}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Select Trainings *</span>
              <span className="text-xs text-muted-foreground">
                {trainingIds.length} selected
              </span>
            </div>
            {trainings.length === 0 ? (
              <EmptyState
                icon={GraduationCap}
                title="No active trainings"
                description="There are no published training courses available to assign."
              />
            ) : (
              <div className="max-h-60 space-y-2 overflow-y-auto rounded-lg border bg-card/20 p-2 pr-1">
                {trainings.map((training) => (
                  <label
                    key={training.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border bg-card/50 p-2.5 text-sm transition hover:bg-muted/40"
                  >
                    <input
                      type="checkbox"
                      className="rounded accent-primary"
                      checked={trainingIds.includes(training.id)}
                      onChange={() =>
                        toggle(trainingIds, training.id, setTrainingIds)
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium leading-none">
                        {training.title}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                        {training.category}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </section>

          <FormField
            label="Due Date"
            htmlFor="dueDate"
            description="Optional target completion date for the assigned users."
          >
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </FormField>

          <Button
            className="mt-2 w-full"
            onClick={assign}
            disabled={!employeeIds.length || !trainingIds.length || isAssigning}
          >
            {isAssigning ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Assigning…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Assign Selected Trainings
              </>
            )}
          </Button>
        </div>
      </Card>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">
          Current Assignments
          {assignments.length > 0 && (
            <span className="ml-2 text-muted-foreground">
              ({assignments.length})
            </span>
          )}
        </h3>
        {tableRows.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No assignments yet"
            description="No training courses have been assigned to employees yet."
          />
        ) : (
          <DataTable
            data={tableRows}
            columns={[
              { key: "employee", label: "Employee", type: "text" },
              { key: "training", label: "Training Title", type: "text" },
              { key: "progress", label: "Watch Progress", type: "progress" },
              { key: "dueDate", label: "Due Date", type: "date" },
              { key: "status", label: "Status", type: "status" },
            ]}
            renderActions={(row) => {
              if (row.isCompleted) return null; // Don't show delete for completed assignments
              return (
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    className="h-9 w-9 px-0 text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      const assignment = assignments.find(
                        (a) => a.id === row.id
                      );
                      if (assignment) setDeleteTarget(assignment);
                    }}
                    title="Delete assignment"
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
        title="Delete assignment?"
        description={`This removes the training assignment for ${deleteTarget?.employee?.fullName ?? "this employee"}. Their progress data will also be lost. This action cannot be undone.`}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
