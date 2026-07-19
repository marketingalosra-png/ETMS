import { AnimatedPage } from "@/components/animated-page";
import { CompletedTrainingsManager } from "@/components/admin/completed-trainings-manager";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { toAssignmentDTO } from "@/lib/dto";

export default async function CompletedTrainingsPage() {
  await requireAdmin();

  const rawAssignments = await prisma.assignment.findMany({
    where: {
      completedAt: { not: null },
    },
    include: {
      employee: {
        include: {
          user: true,
          department: true,
        },
      },
      training: true,
    },
    orderBy: {
      completedAt: "desc",
    },
  });

  // Serialize to plain DTOs to cross the Server -> Client boundary safely
  const assignments = rawAssignments.map(toAssignmentDTO);

  return (
    <AnimatedPage>
      <div className="mb-5">
        <p className="text-sm font-semibold text-primary">Compliance & Approvals</p>
        <h2 className="mt-1 text-3xl font-bold font-display">Completed Trainings</h2>
        <p className="mt-2 text-muted-foreground text-sm max-w-2xl">
          Review employee training submissions, verify their learning summaries, and approve or reject submissions with notes.
        </p>
      </div>

      <CompletedTrainingsManager initialAssignments={assignments} />
    </AnimatedPage>
  );
}
