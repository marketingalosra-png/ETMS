import { type NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { json, withApiGuard } from "@/lib/api";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiGuard(
    request,
    async () => {
      const session = await auth();
      const { id } = await params;

      const assignment = await prisma.assignment.findUnique({
        where: { id },
        include: { employee: true, training: true },
      });
      if (!assignment) {
        return json({ error: "Assignment not found" }, { status: 404 });
      }

      // Prevent deleting already-completed assignments (soft protection)
      if (assignment.completedAt) {
        return json(
          { error: "Cannot delete a completed assignment. Archive it instead." },
          { status: 409 }
        );
      }

      await prisma.assignment.delete({ where: { id } });

      await audit({
        userId: session?.user.id,
        actorName: session?.user.name ?? "Admin",
        action: "assignment.deleted",
        entity: "Assignment",
        entityId: id,
        metadata: {
          employeeName: assignment.employee.fullName,
          trainingTitle: assignment.training.title,
        },
      });
      return json({ ok: true });
    },
    { adminOnly: true }
  );
}
