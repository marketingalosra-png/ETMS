import { AnimatedPage } from "@/components/animated-page";
import { TrainingCard } from "@/components/training-card";
import { prisma } from "@/lib/prisma";
import { requireEmployeeOrAdmin } from "@/lib/session";
import { toIso } from "@/lib/dto";
import { EmptyState } from "@/components/ui/empty-state";
import { GraduationCap } from "lucide-react";

export default async function MyTrainingsPage() {
  const session = await requireEmployeeOrAdmin();

  const employee = await prisma.employee.findUnique({
    where: { userId: session.user.id },
    include: {
      assignments: {
        include: { training: true },
        orderBy: { dueDate: "asc" },
      },
    },
  });

  const hasAssignments = employee?.assignments && employee.assignments.length > 0;

  return (
    <AnimatedPage>
      <div className="mb-5">
        <p className="text-sm font-semibold text-primary">Learning</p>
        <h2 className="mt-1 text-3xl font-bold">My Trainings</h2>
        <p className="mt-2 text-muted-foreground text-sm">
          Continue assigned videos, track progress, and stay ahead of deadlines.
        </p>
      </div>
      <div className="space-y-4">
        {hasAssignments ? (
          employee?.assignments.map((assignment) => (
            <TrainingCard
              key={assignment.id}
              id={assignment.training.id}
              assignmentId={assignment.id}
              title={assignment.training.title}
              description={assignment.training.description}
              thumbnailUrl={assignment.training.thumbnailUrl}
              dueDate={toIso(assignment.dueDate)}
              progress={assignment.progressPercent}
              status={assignment.status}
            />
          ))
        ) : (
          <EmptyState
            icon={GraduationCap}
            title="No trainings assigned yet"
            description="You don't have any training courses assigned to your account right now. Check back later or contact your supervisor."
          />
        )}
      </div>
    </AnimatedPage>
  );
}
