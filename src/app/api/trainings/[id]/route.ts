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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiGuard(request, async () => {
    const { id } = await params;
    const training = await prisma.training.findUnique({ where: { id }, include: { assets: true } });
    if (!training) return json({ error: "Training not found" }, { status: 404 });
    return json({ training });
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiGuard(request, async () => {
    const { id } = await params;
    const input = await parseBody(
      request,
      trainingSchema.partial().extend({
        videoUrl: videoUrlSchema
      })
    );
    const { videoUrl, ...trainingData } = input;
    const existingAsset = await prisma.trainingAsset.findFirst({ where: { trainingId: id, type: { in: ["VIDEO_UPLOAD", "VIDEO_YOUTUBE", "VIDEO_EXTERNAL"] } } });
    const training = await prisma.training.update({
      where: { id },
      data: {
        ...trainingData,
        assets: videoUrl
          ? existingAsset
            ? {
                update: {
                  where: { id: existingAsset.id },
                  data: {
                    url: videoUrl,
                    title: `${trainingData.title ?? "Training"} video`,
                    type: videoAssetType(videoUrl)
                  }
                }
              }
            : {
                create: {
                  url: videoUrl,
                  title: `${trainingData.title ?? "Training"} video`,
                  type: videoAssetType(videoUrl),
                  durationSeconds: trainingData.estimatedMinutes ? trainingData.estimatedMinutes * 60 : undefined
                }
              }
          : undefined
      },
      include: { assets: true, assignments: true }
    });
    await audit({ actorName: "Admin", action: "training.updated", entity: "Training", entityId: training.id });
    return json({ training });
  }, { adminOnly: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiGuard(request, async () => {
    const { id } = await params;
    const training = await prisma.training.delete({ where: { id } });
    await audit({ actorName: "Admin", action: "training.deleted", entity: "Training", entityId: id });
    return json({ training });
  }, { adminOnly: true });
}
