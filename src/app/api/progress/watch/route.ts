import { type NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { json, parseBody, withApiGuard } from "@/lib/api";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { progressSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  return withApiGuard(request, async () => {
    const session = await auth();
    const input = await parseBody(request, progressSchema);
    const employee = await prisma.employee.findUnique({ where: { userId: session!.user.id } });
    if (!employee && session?.user.role !== "ADMIN") return json({ error: "Employee profile not found" }, { status: 404 });

    const assignment = await prisma.assignment.findUnique({
      where: { id: input.assignmentId },
      include: { employee: true, training: true }
    });
    if (!assignment) return json({ error: "Assignment not found" }, { status: 404 });
    if (session?.user.role === "EMPLOYEE" && assignment.employee.userId !== session.user.id) return json({ error: "Forbidden" }, { status: 403 });

    const percentWatched = Math.min(100, (input.watchedSeconds / input.durationSeconds) * 100);
    const completed = percentWatched >= 95;
    const status = completed
      ? assignment.dueDate && new Date() > assignment.dueDate
        ? "COMPLETED_LATE"
        : "COMPLETED_ON_TIME"
      : assignment.startedAt
        ? "IN_PROGRESS"
        : "IN_PROGRESS";

    await prisma.$transaction([
      prisma.watchSession.upsert({
        where: { employeeId_assetId: { employeeId: assignment.employeeId, assetId: input.assetId } },
        update: {
          lastSecond: input.lastSecond,
          watchedSeconds: Math.max(input.watchedSeconds, 0),
          durationSeconds: input.durationSeconds,
          percentWatched,
          pausedCount: { increment: input.pausedCount },
          skippedCount: { increment: input.skippedCount },
          replayedCount: { increment: input.replayedCount },
          playbackRate: input.playbackRate,
          completed
        },
        create: {
          employeeId: assignment.employeeId,
          assetId: input.assetId,
          lastSecond: input.lastSecond,
          watchedSeconds: input.watchedSeconds,
          durationSeconds: input.durationSeconds,
          percentWatched,
          playbackRate: input.playbackRate,
          pausedCount: input.pausedCount,
          skippedCount: input.skippedCount,
          replayedCount: input.replayedCount,
          completed
        }
      }),
      prisma.assignment.update({
        where: { id: assignment.id },
        data: {
          progressPercent: Math.max(assignment.progressPercent, percentWatched),
          timeWatchedSec: Math.max(assignment.timeWatchedSec, input.watchedSeconds),
          startedAt: assignment.startedAt ?? new Date(),
          completedAt: completed ? assignment.completedAt ?? new Date() : assignment.completedAt,
          status
        }
      }),
      prisma.progressEvent.create({
        data: {
          assignmentId: assignment.id,
          type: completed ? "video.completed" : "video.progress",
          value: { percentWatched, lastSecond: input.lastSecond }
        }
      })
    ]);

    if (completed && !assignment.completedAt) {
      await audit({ userId: session?.user.id, actorName: session?.user.name ?? assignment.employee.fullName, action: "training.completed", entity: "Assignment", entityId: assignment.id });
    }

    return json({ completed, percentWatched });
  });
}
