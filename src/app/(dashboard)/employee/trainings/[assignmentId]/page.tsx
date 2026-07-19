import { notFound } from "next/navigation";
import { ExternalLink, Play } from "lucide-react";
import { AnimatedPage } from "@/components/animated-page";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { VideoPlayer } from "@/components/video-player";
import { TrainingCompletionForm } from "@/components/training-completion-form";
import { prisma } from "@/lib/prisma";
import { requireEmployeeOrAdmin } from "@/lib/session";
import { daysUntil } from "@/lib/utils";

export default async function TrainingPlayerPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const session = await requireEmployeeOrAdmin();
  const { assignmentId } = await params;

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      employee: true,
      training: {
        include: { assets: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  if (!assignment) notFound();
  if (
    session.user.role === "EMPLOYEE" &&
    assignment.employee.userId !== session.user.id
  ) {
    notFound();
  }

  const asset =
    assignment.training.assets.find((item) =>
      item.type.toString().startsWith("VIDEO")
    ) ?? assignment.training.assets[0];

  const days = daysUntil(assignment.dueDate);
  const isLate = days !== null && days < 0;
  const isCompleted = assignment.status.includes("COMPLETED");

  const dueDateDisplay = assignment.dueDate
    ? assignment.dueDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "None";

  return (
    <AnimatedPage>
      <div className="mb-5">
        <p className="text-sm font-semibold text-primary">Training Player</p>
        <h2 className="mt-1 text-3xl font-bold">
          {assignment.training.title}
        </h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          {assignment.training.description}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone={isCompleted ? "teal" : "blue"}>
            {assignment.status.replaceAll("_", " ")}
          </Badge>
          <Badge tone={isLate ? "red" : "amber"}>
            {days === null
              ? "No due date"
              : isLate
                ? `${Math.abs(days)} days late`
                : `${days} days remaining`}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.36fr]">
        <div className="space-y-4">
          {/* Video source header */}
          {asset?.url && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                <Play className="h-3 w-3" />
                Watch inside ETMS
              </div>
              <a
                href={asset.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
              >
                <ExternalLink className="h-3 w-3" />
                Open in new tab
              </a>
            </div>
          )}

          {/* Player */}
          <Card className="p-0 overflow-hidden">
            {asset ? (
              <VideoPlayer
                src={asset.url}
                title={asset.title}
                assignmentId={assignment.id}
                assetId={asset.id}
                durationSeconds={assignment.training.completionCriteria === "WATCH_95_PERCENT" ? asset.durationSeconds : null}
              />
            ) : (
              <div className="grid aspect-video place-items-center rounded-xl bg-muted text-muted-foreground">
                <div className="text-center">
                  <Play className="mx-auto mb-2 h-10 w-10 opacity-40" />
                  <p className="text-sm">No video asset attached to this training.</p>
                </div>
              </div>
            )}
          </Card>

          {/* Completion form */}
          <TrainingCompletionForm
            assignmentId={assignment.id}
            isAlreadyCompleted={isCompleted}
            existingLearningSummary={assignment.learningSummary}
            existingNotes={assignment.completionNotes}
          />
        </div>

        {/* Sidebar */}
        <Card>
          <h3 className="font-semibold">Course Details</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Category</dt>
              <dd className="font-medium">{assignment.training.category}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Estimated</dt>
              <dd className="font-medium">
                {assignment.training.estimatedMinutes} min
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Difficulty</dt>
              <dd className="font-medium capitalize">
                {assignment.training.difficulty.toLowerCase()}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Priority</dt>
              <dd className="font-medium capitalize">
                {assignment.training.priority.toLowerCase()}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Due Date</dt>
              <dd className="font-medium">{dueDateDisplay}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Completion</dt>
              <dd className="font-medium">Summary + Confirmation</dd>
            </div>
          </dl>
          <div className="mt-5 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            A learning summary of at least 20 characters and confirmation checklist are required to complete this training.
          </div>
          {isCompleted && (
            <div className="mt-3 rounded-lg bg-teal-500/10 p-3 text-xs text-teal-600 dark:text-teal-400">
              ✓ Training submitted for review. The admin will review your
              learning summary.
            </div>
          )}
        </Card>
      </div>
    </AnimatedPage>
  );
}
