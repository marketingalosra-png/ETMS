import { AnimatedPage } from "@/components/animated-page";
import { TrainingManager } from "@/components/admin/training-manager";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { toTrainingDTO } from "@/lib/dto";

export default async function TrainingsPage() {
  await requireAdmin();

  const rawTrainings = await prisma.training.findMany({
    include: { assets: { orderBy: { sortOrder: "asc" } }, assignments: true },
    orderBy: { createdAt: "desc" },
  });

  // Serialize to DTOs — no Prisma objects or Date instances cross the boundary
  const trainings = rawTrainings.map(toTrainingDTO);

  return (
    <AnimatedPage>
      <div className="mb-5">
        <p className="text-sm font-semibold text-primary">Courses</p>
        <h2 className="mt-1 text-3xl font-bold">Training Management</h2>
        <p className="mt-2 text-muted-foreground">
          Create clean training courses with thumbnails, due dates, and uploaded, YouTube,
          or external videos.
        </p>
      </div>
      <TrainingManager initialTrainings={trainings} />
    </AnimatedPage>
  );
}
