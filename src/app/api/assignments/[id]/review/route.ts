import { type NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { json, parseBody, withApiGuard } from "@/lib/api";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toAssignmentDTO } from "@/lib/dto";
import { reviewSchema } from "@/lib/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiGuard(
    request,
    async () => {
      const session = await auth();
      const { id } = await params;
      const input = await parseBody(request, reviewSchema);

      const assignment = await prisma.assignment.findUnique({
        where: { id },
        include: { employee: true, training: true },
      });

      if (!assignment) {
        return json({ error: "Assignment not found" }, { status: 404 });
      }

      if (!assignment.completedAt) {
        return json(
          { error: "Cannot review an assignment that has not been completed." },
          { status: 422 }
        );
      }

      const reviewerName = session?.user.name ?? "Admin";

      const updated = await prisma.assignment.update({
        where: { id },
        data: {
          reviewStatus: input.reviewStatus,
          reviewedBy: reviewerName,
          reviewedAt: new Date(),
          reviewNote: input.reviewNote ?? null,
          // If rejected, reset the assignment status to allow resubmission
          status:
            input.reviewStatus === "RESUBMISSION_REQUESTED"
              ? "IN_PROGRESS"
              : undefined,
          completedAt:
            input.reviewStatus === "RESUBMISSION_REQUESTED"
              ? null
              : undefined,
          learningSummary:
            input.reviewStatus === "RESUBMISSION_REQUESTED"
              ? null
              : undefined,
        },
        include: {
          employee: { include: { user: true, department: true, assignments: true } },
          training: { include: { assets: true, assignments: true } },
        },
      });

      await prisma.progressEvent.create({
        data: {
          assignmentId: id,
          type: `training.review.${input.reviewStatus.toLowerCase()}`,
          value: {
            reviewStatus: input.reviewStatus,
            reviewedBy: reviewerName,
            reviewNote: input.reviewNote,
          },
        },
      });

      await audit({
        userId: session?.user.id,
        actorName: reviewerName,
        action: `training.reviewed.${input.reviewStatus.toLowerCase()}`,
        entity: "Assignment",
        entityId: id,
        metadata: {
          reviewStatus: input.reviewStatus,
          trainingTitle: assignment.training.title,
          employeeName: assignment.employee.fullName,
        },
      });

      return json({ assignment: toAssignmentDTO(updated) });
    },
    { adminOnly: true }
  );
}
