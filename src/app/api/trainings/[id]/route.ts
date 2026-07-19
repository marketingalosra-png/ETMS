import { type NextRequest } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { json, parseBody, withApiGuard } from "@/lib/api";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { trainingSchema } from "@/lib/validation";
import { toTrainingDTO } from "@/lib/dto";

function videoAssetType(url: string) {
  if (url.startsWith("/uploads/")) return "VIDEO_UPLOAD";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "VIDEO_YOUTUBE";
  if (url.includes("vimeo.com")) return "VIDEO_EXTERNAL";
  return "VIDEO_EXTERNAL";
}

// Accepted video URL patterns
const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i;

function isSupportedVideoUrl(url: string): boolean {
  if (url.startsWith("/uploads/")) return true;
  if (VIDEO_EXTENSIONS.test(url)) return true;
  if (url.includes("youtube.com") || url.includes("youtu.be")) return true;
  if (url.includes("vimeo.com")) return true;
  if (url.includes(".m3u8") || url.includes(".mpd")) return true;
  if (
    url.includes("cloudflarestream.com") ||
    url.includes("mux.com") ||
    url.includes("cloudinary.com")
  )
    return true;
  return false;
}

const videoUrlSchema = z
  .union([
    z.string().url().refine(isSupportedVideoUrl, {
      message:
        "URL must point to a supported video source (MP4, WebM, OGG, YouTube, Vimeo, or a supported CDN/streaming provider).",
    }),
    z.string().regex(/^\/uploads\/[\w.-]+$/),
    z.literal(""),
    z.null(),
    z.undefined(),
  ])
  .transform((value) => (value === "" ? null : value));

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiGuard(request, async () => {
    const { id } = await params;
    const training = await prisma.training.findUnique({
      where: { id },
      include: {
        assets: { orderBy: { sortOrder: "asc" } },
        assignments: true,
      },
    });
    if (!training) return json({ error: "Training not found" }, { status: 404 });
    return json({ training: toTrainingDTO(training) });
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiGuard(
    request,
    async () => {
      const session = await auth();
      const { id } = await params;

      // Verify training exists
      const existing = await prisma.training.findUnique({ where: { id } });
      if (!existing) {
        return json({ error: "Training not found" }, { status: 404 });
      }

      const input = await parseBody(
        request,
        trainingSchema.partial().extend({
          videoUrl: videoUrlSchema,
        })
      );
      const { videoUrl, ...trainingData } = input;
      const existingAsset = await prisma.trainingAsset.findFirst({
        where: {
          trainingId: id,
          type: { in: ["VIDEO_UPLOAD", "VIDEO_YOUTUBE", "VIDEO_EXTERNAL"] },
        },
      });
      const training = await prisma.training.update({
        where: { id },
        data: {
          ...trainingData,
          assets:
            videoUrl !== undefined
              ? videoUrl === null
                ? existingAsset
                  ? { delete: { id: existingAsset.id } }
                  : undefined
                : existingAsset
                  ? {
                      update: {
                        where: { id: existingAsset.id },
                        data: {
                          url: videoUrl,
                          title: `${trainingData.title ?? existing.title} video`,
                          type: videoAssetType(videoUrl),
                        },
                      },
                    }
                  : {
                      create: {
                        url: videoUrl,
                        title: `${trainingData.title ?? existing.title} video`,
                        type: videoAssetType(videoUrl),
                        durationSeconds: trainingData.estimatedMinutes
                          ? trainingData.estimatedMinutes * 60
                          : existing.estimatedMinutes * 60,
                      },
                    }
              : undefined,
        },
        include: { assets: { orderBy: { sortOrder: "asc" } }, assignments: true },
      });
      await audit({
        userId: session?.user.id,
        actorName: session?.user.name ?? "Admin",
        action: "training.updated",
        entity: "Training",
        entityId: training.id,
        metadata: { title: training.title },
      });
      return json({ training: toTrainingDTO(training) });
    },
    { adminOnly: true }
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiGuard(
    request,
    async () => {
      const session = await auth();
      const { id } = await params;

      const training = await prisma.training.findUnique({ where: { id } });
      if (!training) {
        return json({ error: "Training not found" }, { status: 404 });
      }

      await prisma.training.delete({ where: { id } });
      await audit({
        userId: session?.user.id,
        actorName: session?.user.name ?? "Admin",
        action: "training.deleted",
        entity: "Training",
        entityId: id,
        metadata: { title: training.title },
      });
      return json({ ok: true });
    },
    { adminOnly: true }
  );
}
