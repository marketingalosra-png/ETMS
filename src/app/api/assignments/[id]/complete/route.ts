import { type NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { json, parseBody, withApiGuard } from "@/lib/api";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { completionSchema } from "@/lib/validation";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiGuard(request, async () => {
    const session = await auth();
    const { id } = await params;
    const input = await parseBody(request, completionSchema);

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        employee: true,
        training: { include: { assets: true } },
      },
    });

    if (!assignment) {
      return json({ error: "Assignment not found" }, { status: 404 });
    }

    // Only the employee who owns the assignment (or admin) can complete it
    if (
      session?.user.role === "EMPLOYEE" &&
      assignment.employee.userId !== session.user.id
    ) {
      return json({ error: "Forbidden" }, { status: 403 });
    }

    // Prevent duplicate completions
    if (assignment.completedAt) {
      return json(
        { error: "This training has already been marked as complete." },
        { status: 409 }
      );
    }

    // -----------------------------------------------------------------------
    // Completion criteria validation (Bypassed: we treat everything as PASS_ACKNOWLEDGEMENT)
    // -----------------------------------------------------------------------
    const criteria = assignment.training.completionCriteria;

    const completedStatus =
      assignment.dueDate && new Date() > assignment.dueDate
        ? "COMPLETED_LATE"
        : "COMPLETED_ON_TIME";

    const updated = await prisma.assignment.update({
      where: { id },
      data: {
        status: completedStatus,
        completedAt: new Date(),
        learningSummary: input.learningSummary,
        completionNotes: input.completionNotes ?? null,
        reviewStatus: "PENDING_REVIEW",
      },
    });

    // Award XP to employee
    await prisma.employee.update({
      where: { id: assignment.employeeId },
      data: {
        xp: { increment: 100 },
        streakDays: { increment: 1 },
      },
    });

    await prisma.progressEvent.create({
      data: {
        assignmentId: id,
        type: "training.completed",
        value: {
          status: completedStatus,
          completionCriteria: criteria,
          learningSummary: input.learningSummary,
        },
      },
    });

    await audit({
      userId: session?.user.id,
      actorName: session?.user.name ?? assignment.employee.fullName,
      action: "training.completed",
      entity: "Assignment",
      entityId: id,
      metadata: {
        trainingTitle: assignment.training.title,
        status: completedStatus,
        completionCriteria: criteria,
      },
    });

    return json({ assignment: updated });
  });
}
