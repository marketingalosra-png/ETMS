"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// Serializable column definition — safe to pass from Server Components
// ---------------------------------------------------------------------------

export type BadgeTone = "blue" | "teal" | "amber" | "red" | "gray";

export type ColumnType =
  | "text"
  | "badge"
  | "date"
  | "number"
  | "status"
  | "progress";

export type ColumnDef = {
  key: string;
  label: string;
  type?: ColumnType;
  /** Optional badge tone — used when type is "badge" or "status" */
  tone?: BadgeTone;
  className?: string;
};

// ---------------------------------------------------------------------------
// Row value type — every cell value must be a plain primitive
// ---------------------------------------------------------------------------

export type RowData = Record<string, string | number | boolean | null | undefined>;

// ---------------------------------------------------------------------------
// Helpers for deriving tone from status string
// ---------------------------------------------------------------------------

function statusTone(value: string): BadgeTone {
  const upper = value.toUpperCase();
  if (upper.includes("COMPLETED")) return "teal";
  if (upper.includes("LATE") || upper.includes("OVERDUE") || upper.includes("EXPIRED")) return "red";
  if (upper.includes("IN_PROGRESS") || upper.includes("NOT_STARTED")) return "blue";
  if (upper.includes("ACTIVE")) return "teal";
  if (upper.includes("DEACTIVATED") || upper.includes("INACTIVE")) return "red";
  if (upper.includes("CRITICAL")) return "red";
  if (upper.includes("HIGH")) return "amber";
  if (upper.includes("MEDIUM") || upper.includes("LOW")) return "blue";
  if (upper.includes("PUBLISHED")) return "teal";
  if (upper.includes("DRAFT")) return "amber";
  if (upper.includes("ARCHIVED")) return "gray";
  return "gray";
}

function renderCell(column: ColumnDef, row: RowData): ReactNode {
  const raw = row[column.key];
  const text = raw === null || raw === undefined ? "—" : String(raw);

  switch (column.type) {
    case "badge":
      return (
        <Badge tone={column.tone ?? "gray"}>{text}</Badge>
      );

    case "status":
      return (
        <Badge tone={column.tone ?? statusTone(text)}>
          {text.replaceAll("_", " ")}
        </Badge>
      );

    case "progress":
      return (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(Number(raw) || 0, 100)}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{text}%</span>
        </div>
      );

    case "date":
      if (!raw) return <span className="text-muted-foreground">—</span>;
      try {
        const d = new Date(String(raw));
        return isNaN(d.getTime()) ? text : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      } catch {
        return text;
      }

    case "number":
      return <span className="tabular-nums">{text}</span>;

    case "text":
    default:
      return text;
  }
}

// ---------------------------------------------------------------------------
// DataTable component — safe for Server and Client usage
//
// When used inside a Client Component, you may optionally pass renderActions
// to render interactive action buttons. This callback is intentionally
// restricted to Client Components and must NOT be passed from Server Components.
// ---------------------------------------------------------------------------

type DataTableProps<T extends RowData> = {
  columns: ColumnDef[];
  data: T[];
  empty?: string;
  /** Client-only: render action buttons for a row. Never pass from Server Components. */
  renderActions?: (row: T) => ReactNode;
};

export function DataTable<T extends RowData>({
  columns,
  data,
  empty,
  renderActions,
}: DataTableProps<T>) {
  const effectiveCols = renderActions
    ? [...columns, { key: "__actions__", label: "", type: "text" as ColumnType }]
    : columns;

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            <tr>
              {effectiveCols.map((col) => (
                <th
                  key={col.key}
                  className={cn("px-4 py-3 font-semibold", col.className)}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-10 text-center text-muted-foreground"
                  colSpan={effectiveCols.length}
                >
                  {empty ?? "No records found"}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={(row.id as string | undefined) ?? index}
                  className="border-b last:border-b-0 hover:bg-muted/35 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn("px-4 py-3 align-middle", col.className)}
                    >
                      {renderCell(col, row)}
                    </td>
                  ))}
                  {renderActions ? (
                    <td className="px-4 py-3 align-middle text-right">
                      {renderActions(row)}
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
