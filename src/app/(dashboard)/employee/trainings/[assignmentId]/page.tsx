import { notFound } from "next/navigation";
import { AnimatedPage } from "@/components/animated-page";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { VideoPlayer } from "@/components/video-player";
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

  // Convert Date → number (days) for display — all done server-side
  const days = daysUntil(assignment.dueDate);
  const isLate = days !== null && days < 0;

  // Format due date as a string for display (no Date objects passed to Client Components)
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
        <h2 className="mt-1 text-3xl font-bold">{assignment.training.title}</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          {assignment.training.description}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone={assignment.status.includes("COMPLETED") ? "teal" : "blue"}>
            {assignment.status.replaceAll("_", " ")}
          </Badge>
          <Badge tone={isLate ? "red" : "amber"}>
            {days === null
              ? "No due date"
              : isLate
                ? `${Math.abs(days)} days late`
                : `${days} days remaining`}
          </Badge>
          <Badge>{Math.round(assignment.progressPercent)}% watched</Badge>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.36fr]">
        <Card>
          {asset?.type === "VIDEO_YOUTUBE" ? (
            <div className="aspect-video overflow-hidden rounded-xl bg-black">
              <iframe
                className="h-full w-full"
                src={asset.url}
                title={asset.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : asset ? (
            <VideoPlayer
              src={asset.url}
              assignmentId={assignment.id}
              assetId={asset.id}
              durationSeconds={asset.durationSeconds}
            />
          ) : (
            <div className="grid aspect-video place-items-center rounded-xl bg-muted text-muted-foreground">
              No video asset is attached to this training.
            </div>
          )}
        </Card>
        <Card>
          <h3 className="font-semibold">Course Details</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Category</dt>
              <dd>{assignment.training.category}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Estimated</dt>
              <dd>{assignment.training.estimatedMinutes} min</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Due Date</dt>
              <dd>{dueDateDisplay}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Completion</dt>
              <dd>95% watched</dd>
            </div>
          </dl>
          <div className="mt-5 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
            Playback progress is saved automatically. When the player reaches 95%,
            the assignment is marked complete.
          </div>
        </Card>
      </div>
    </AnimatedPage>
  );
}
