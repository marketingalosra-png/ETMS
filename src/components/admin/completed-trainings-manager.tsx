"use client";

import { useMemo, useState } from "react";
import { Check, X, RefreshCw, FileText, Search, Filter, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { AssignmentDTO } from "@/lib/dto";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

// ---------------------------------------------------------------------------
// NoteDialog: modal to enter rejection/resubmission reason
// ---------------------------------------------------------------------------

function NoteDialog({
  open,
  title,
  description,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  onConfirm: (note: string) => void;
}) {
  const [note, setNote] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4">
      <div className="glass w-full max-w-md overflow-hidden rounded-xl border bg-card/90 p-5 shadow-lg backdrop-blur-xl">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        <textarea
          autoFocus
          className="mt-4 min-h-24 w-full rounded-lg border bg-card/70 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          placeholder="Enter reason..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!note.trim()) {
                toast.error("Please provide a note/reason");
                return;
              }
              onConfirm(note);
              setNote("");
            }}
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DetailsDialog: Modal to view full details of completed training
// ---------------------------------------------------------------------------

function DetailsDialog({
  open,
  assignment,
  onClose,
}: {
  open: boolean;
  assignment: AssignmentDTO | null;
  onClose: () => void;
}) {
  if (!open || !assignment) return null;

  const completedDisplay = assignment.completedAt
    ? new Date(assignment.completedAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  const reviewedDisplay = assignment.reviewedAt
    ? new Date(assignment.reviewedAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4">
      <div className="glass w-full max-w-2xl overflow-hidden rounded-xl border bg-card/90 p-6 shadow-lg backdrop-blur-xl max-h-[85vh] overflow-y-auto">
        <h3 className="text-xl font-bold">Training Submission Details</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {"Review the employee's learning summary and completion details."}
        </p>

        <div className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="text-xs font-semibold text-muted-foreground block">Employee</span>
              <span className="text-sm font-medium">{assignment.employee?.fullName}</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground block">Training Course</span>
              <span className="text-sm font-medium">{assignment.training?.title}</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="text-xs font-semibold text-muted-foreground block">Completion Date</span>
              <span className="text-sm font-medium">{completedDisplay}</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground block">Watch Progress</span>
              <span className="text-sm font-medium">{Math.round(assignment.progressPercent)}% watched</span>
            </div>
          </div>

          <hr className="border-muted/50" />

          <div>
            <span className="text-xs font-semibold text-muted-foreground block mb-1">What was learned</span>
            <div className="rounded-lg bg-muted/40 p-3.5 text-sm whitespace-pre-wrap">
              {assignment.learningSummary || "No learning summary provided."}
            </div>
          </div>

          {assignment.completionNotes && (
            <div>
              <span className="text-xs font-semibold text-muted-foreground block mb-1">Employee Notes</span>
              <div className="rounded-lg bg-muted/40 p-3.5 text-sm whitespace-pre-wrap">
                {assignment.completionNotes}
              </div>
            </div>
          )}

          <hr className="border-muted/50" />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="text-xs font-semibold text-muted-foreground block">Review Status</span>
              <div className="mt-1">
                <Badge
                  tone={
                    assignment.reviewStatus === "APPROVED"
                      ? "teal"
                      : assignment.reviewStatus === "REJECTED"
                        ? "red"
                        : assignment.reviewStatus === "RESUBMISSION_REQUESTED"
                          ? "amber"
                          : "blue"
                  }
                >
                  {(assignment.reviewStatus || "PENDING_REVIEW").replaceAll("_", " ")}
                </Badge>
              </div>
            </div>
            {assignment.reviewedBy && (
              <div>
                <span className="text-xs font-semibold text-muted-foreground block">Reviewed By</span>
                <span className="text-sm font-medium">
                  {assignment.reviewedBy} on {reviewedDisplay}
                </span>
              </div>
            )}
          </div>

          {assignment.reviewNote && (
            <div>
              <span className="text-xs font-semibold text-muted-foreground block mb-1">Admin Feedback Note</span>
              <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
                {assignment.reviewNote}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CompletedTrainingsManager
// ---------------------------------------------------------------------------

export function CompletedTrainingsManager({
  initialAssignments,
}: {
  initialAssignments: AssignmentDTO[];
}) {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [detailsTarget, setDetailsTarget] = useState<AssignmentDTO | null>(null);
  
  // Note dialog state
  const [noteDialog, setNoteDialog] = useState<{
    open: boolean;
    assignmentId: string;
    actionType: "REJECTED" | "RESUBMISSION_REQUESTED";
    title: string;
    description: string;
  } | null>(null);

  // Search, filter, and sort (default by completion date descending)
  const filtered = useMemo(() => {
    let result = [...assignments];

    // Status filter
    if (statusFilter !== "ALL") {
      result = result.filter((a) => {
        const status = a.reviewStatus || "PENDING_REVIEW";
        return status === statusFilter;
      });
    }

    // Search query
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.employee?.fullName?.toLowerCase().includes(term) ||
          a.training?.title?.toLowerCase().includes(term)
      );
    }

    // Sort by completion date descending
    result.sort((a, b) => {
      const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return dateB - dateA;
    });

    return result;
  }, [assignments, search, statusFilter]);

  async function handleReview(
    assignmentId: string,
    reviewStatus: "APPROVED" | "REJECTED" | "RESUBMISSION_REQUESTED",
    reviewNote?: string
  ) {
    const response = await fetch(`/api/assignments/${assignmentId}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewStatus, reviewNote }),
    });

    if (!response.ok) {
      toast.error("Failed to update review status");
      return;
    }

    const payload = (await response.json()) as { assignment: AssignmentDTO };
    setAssignments((current) =>
      current.map((item) =>
        item.id === payload.assignment.id
          ? {
              ...item,
              ...payload.assignment,
              employee: item.employee,
              training: item.training,
            }
          : item
      )
    );
    toast.success(`Submission marked as ${reviewStatus.replaceAll("_", " ").toLowerCase()}`);
    setNoteDialog(null);
  }

  // Rows for DataTable
  const tableRows = filtered.map((a) => {
    const completedDate = a.completedAt
      ? new Date(a.completedAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

    return {
      id: a.id,
      employee: a.employee?.fullName ?? "—",
      training: a.training?.title ?? "—",
      progress: `${Math.round(a.progressPercent)}%`,
      completedAt: completedDate,
      summary: a.learningSummary ? `${a.learningSummary.slice(0, 50)}...` : "—",
      notes: a.completionNotes ? `${a.completionNotes.slice(0, 40)}...` : "—",
      status: a.reviewStatus || "PENDING_REVIEW",
      reviewedBy: a.reviewedBy ?? "—",
    };
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search completed trainings by employee or training title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            className="h-10 rounded-lg border bg-card px-3 text-sm outline-none focus:border-primary"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="RESUBMISSION_REQUESTED">Resubmission Requested</option>
          </select>
        </div>
      </div>

      {tableRows.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No completed trainings found"
          description="We couldn't find any submissions matching your search criteria or review filter."
          action={
            search || statusFilter !== "ALL"
              ? {
                  label: "Reset filters",
                  onClick: () => {
                    setSearch("");
                    setStatusFilter("ALL");
                  },
                }
              : undefined
          }
        />
      ) : (
        <DataTable
          data={tableRows}
          columns={[
            { key: "employee", label: "Employee", type: "text" },
            { key: "training", label: "Training", type: "text" },
            { key: "progress", label: "Watch %", type: "text" },
            { key: "completedAt", label: "Completed At", type: "text" },
            { key: "summary", label: "Learning Summary", type: "text" },
            { key: "notes", label: "Notes", type: "text" },
            { key: "status", label: "Status", type: "status" },
            { key: "reviewedBy", label: "Reviewed By", type: "text" },
          ]}
          renderActions={(row) => {
            const assignment = assignments.find((a) => a.id === row.id);
            if (!assignment) return null;

            const isPending =
              !assignment.reviewStatus ||
              assignment.reviewStatus === "PENDING_REVIEW";

            return (
              <div className="flex justify-end gap-1.5">
                <Button
                  variant="ghost"
                  className="h-9 w-9 px-0"
                  onClick={() => setDetailsTarget(assignment)}
                  title="View full submission details"
                >
                  <FileText className="h-4 w-4" />
                </Button>
                {isPending && (
                  <>
                    <Button
                      variant="ghost"
                      className="h-9 w-9 px-0 text-emerald-500 hover:bg-emerald-500/10"
                      onClick={() => handleReview(assignment.id, "APPROVED")}
                      title="Approve training completion"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-9 w-9 px-0 text-amber-500 hover:bg-amber-500/10"
                      onClick={() =>
                        setNoteDialog({
                          open: true,
                          assignmentId: assignment.id,
                          actionType: "RESUBMISSION_REQUESTED",
                          title: "Request Resubmission",
                          description:
                            "Provide feedback or reason why you require the employee to resubmit their learning summary.",
                        })
                      }
                      title="Request resubmission"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-9 w-9 px-0 text-red-500 hover:bg-red-500/10"
                      onClick={() =>
                        setNoteDialog({
                          open: true,
                          assignmentId: assignment.id,
                          actionType: "REJECTED",
                          title: "Reject Submission",
                          description:
                            "Provide feedback or reason for rejecting this training completion submission.",
                        })
                      }
                      title="Reject submission"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            );
          }}
        />
      )}

      {/* Popups */}
      <DetailsDialog
        open={Boolean(detailsTarget)}
        assignment={detailsTarget}
        onClose={() => setDetailsTarget(null)}
      />

      <NoteDialog
        open={Boolean(noteDialog?.open)}
        title={noteDialog?.title ?? ""}
        description={noteDialog?.description ?? ""}
        onClose={() => setNoteDialog(null)}
        onConfirm={(note) => {
          if (noteDialog) {
            handleReview(
              noteDialog.assignmentId,
              noteDialog.actionType,
              note
            );
          }
        }}
      />
    </div>
  );
}
