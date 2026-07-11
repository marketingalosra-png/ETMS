import { type NextRequest } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { json, parseBody, withApiGuard } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { trainingSchema } from "@/lib/validation";

function videoAssetType(url: string) {
  if (url.startsWith("/uploads/")) return "VIDEO_UPLOAD";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "VIDEO_YOUTUBE";
  return "VIDEO_EXTERNAL";
}

const videoUrlSchema = z.union([
  z.string().url(),
  z.string().regex(/^\/uploads\/[\w.-]+$/),
  z.literal(""),
  z.null(),
  z.undefined()
]).transform((value) => value === "" ? null : value);

export async function GET(request: NextRequest) {
  return withApiGuard(request, async () => {
    const trainings = await prisma.training.findMany({
      include: { assets: { orderBy: { sortOrder: "asc" } }, assignments: true },
      orderBy: { createdAt: "desc" }
    });
    return json({ trainings });
  });
}

export async function POST(request: NextRequest) {
  return withApiGuard(request, async () => {
    const input = await parseBody(request, trainingSchema.extend({
      videoUrl: videoUrlSchema
    }));
    const training = await prisma.training.create({
      data: {
        title: input.title,
        description: input.description,
        category: input.category,
        difficulty: input.difficulty,
        estimatedMinutes: input.estimatedMinutes,
        dueDate: input.dueDate,
        thumbnailUrl: input.thumbnailUrl,
        priority: input.priority,
        status: input.status,
        tags: input.tags,
        completionCriteria: input.completionCriteria,
        assets: input.videoUrl
          ? {
              create: {
                title: `${input.title} video`,
                url: input.videoUrl,
                type: videoAssetType(input.videoUrl),
                durationSeconds: input.estimatedMinutes * 60
              }
            }
          : undefined
      },
      include: { assets: true, assignments: true }
    });
    await audit({ actorName: "Admin", action: "training.created", entity: "Training", entityId: training.id });
    return json({ training }, { status: 201 });
  }, { adminOnly: true });
}
