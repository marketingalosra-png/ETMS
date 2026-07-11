import Link from "next/link";
import { CalendarClock, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/progress-ring";
import { daysUntil } from "@/lib/utils";

// ---------------------------------------------------------------------------
// TrainingCard — safe for Server Component rendering
//
// All props are plain serializable values.
// dueDate is accepted as an ISO string (converted server-side from Date).
// ---------------------------------------------------------------------------

export function TrainingCard({
  id,
  assignmentId,
  title,
  description,
  thumbnailUrl,
  dueDate,
  progress,
  status,
}: {
  id: string;
  assignmentId: string;
  title: string;
  description: string;
  thumbnailUrl?: string | null;
  /** ISO date string — convert Date to string before passing from Server Components */
  dueDate?: string | null;
  progress: number;
  status: string;
}) {
  // daysUntil accepts string | Date | null — both work fine
  const days = daysUntil(dueDate);
  const late = days !== null && days < 0 && !status.includes("COMPLETED");

  return (
    <Card className="overflow-hidden p-0">
      <div className="grid md:grid-cols-[220px_1fr]">
        <div className="h-48 bg-muted md:h-full">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-muted-foreground">
              <PlayCircle className="h-10 w-10" />
            </div>
          )}
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{description}</p>
            </div>
            <ProgressRing value={progress} size={74} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge tone={status.includes("COMPLETED") ? "teal" : late ? "red" : "blue"}>
              {status.replaceAll("_", " ")}
            </Badge>
            <Badge tone={late ? "red" : "amber"}>
              <CalendarClock className="mr-1 h-3 w-3" />
              {days === null
                ? "No due date"
                : late
                  ? `${Math.abs(days)} days late`
                  : `${days} days left`}
            </Badge>
          </div>
          <div className="mt-5">
            <Link href={`/employee/trainings/${assignmentId}`}>
              <Button>
                <PlayCircle className="h-4 w-4" />
                Watch Training
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
