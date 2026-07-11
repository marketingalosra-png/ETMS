"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { EmployeeDTO, TrainingDTO, AssignmentDTO } from "@/lib/dto";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// ---------------------------------------------------------------------------
// AssignmentManager — Client Component
// Receives plain DTO objects from Server Components
// ---------------------------------------------------------------------------

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
    if (!response.ok) return toast.error("Assignment failed");
    const fresh = (await fetch("/api/assignments").then((r) =>
      r.json()
    )) as { assignments: AssignmentDTO[] };
    setAssignments(fresh.assignments);
    setEmployeeIds([]);
    setTrainingIds([]);
    setDueDate("");
    toast.success("Training assigned");
  }

  // Serializable rows for DataTable — all values are plain strings/numbers
  type AssignmentRow = {
    id: string;
    employee: string;
    employeeCode: string;
    training: string;
    progress: number;
    dueDate: string;
    status: string;
  };

  const tableRows: AssignmentRow[] = assignments.map((a) => {
    const isOverdue =
      a.dueDate &&
      new Date(a.dueDate) < new Date() &&
      !a.completedAt;
    return {
      id: a.id,
      employee: a.employee?.fullName ?? "—",
      employeeCode: a.employee?.employeeCode ?? "—",
      training: a.training?.title ?? "—",
      progress: Math.round(a.progressPercent),
      dueDate: a.dueDate ?? "",
      status: isOverdue ? "OVERDUE" : a.status,
    };
  });

  return (
    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.35fr]">
      <Card>
        <CardHeader>
          <CardTitle>Assign Trainings</CardTitle>
        </CardHeader>
        <div className="space-y-5">
          <section>
            <p className="mb-2 text-sm font-semibold">Employees</p>
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {employees.map((emp) => (
                <label
                  key={emp.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border bg-card/50 p-3 text-sm hover:bg-muted/40"
                >
                  <input
                    type="checkbox"
                    checked={employeeIds.includes(emp.id)}
                    onChange={() => toggle(employeeIds, emp.id, setEmployeeIds)}
                  />
                  <span className="font-medium">{emp.fullName}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {emp.department?.name ?? "No dept"}
                  </span>
                </label>
              ))}
            </div>
          </section>
          <section>
            <p className="mb-2 text-sm font-semibold">Trainings</p>
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {trainings.map((training) => (
                <label
                  key={training.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border bg-card/50 p-3 text-sm hover:bg-muted/40"
                >
                  <input
                    type="checkbox"
                    checked={trainingIds.includes(training.id)}
                    onChange={() =>
                      toggle(trainingIds, training.id, setTrainingIds)
                    }
                  />
                  <span className="font-medium">{training.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {training.category}
                  </span>
                </label>
              ))}
            </div>
          </section>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <Button className="w-full" onClick={assign}>
            <Send className="h-4 w-4" />
            Assign selected
          </Button>
        </div>
      </Card>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Current Assignments</h3>
        <DataTable
          data={tableRows}
          columns={[
            { key: "employee", label: "Employee", type: "text" },
            { key: "training", label: "Training", type: "text" },
            { key: "progress", label: "Progress", type: "progress" },
            { key: "dueDate", label: "Due", type: "date" },
            { key: "status", label: "Status", type: "status" },
          ]}
        />
      </div>
    </div>
  );
}
