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

export async function GET(request: NextRequest) {
  return withApiGuard(request, async () => {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search") ?? "";

    const trainings = await prisma.training.findMany({
      where: {
        ...(status ? { status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED" } : {}),
        ...(category ? { category: { equals: category, mode: "insensitive" } } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { category: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { assets: { orderBy: { sortOrder: "asc" } }, assignments: true },
      orderBy: { createdAt: "desc" },
    });
    return json({ trainings: trainings.map(toTrainingDTO) });
  });
}

export async function POST(request: NextRequest) {
  return withApiGuard(
    request,
    async () => {
      const session = await auth();
      const input = await parseBody(
        request,
        trainingSchema.extend({
          videoUrl: videoUrlSchema,
        })
      );
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
          createdById: session?.user.id,
          assets: input.videoUrl
            ? {
                create: {
                  title: `${input.title} video`,
                  url: input.videoUrl,
                  type: videoAssetType(input.videoUrl),
                  durationSeconds: input.estimatedMinutes * 60,
                },
              }
            : undefined,
        },
        include: { assets: true, assignments: true },
      });
      await audit({
        userId: session?.user.id,
        actorName: session?.user.name ?? "Admin",
        action: "training.created",
        entity: "Training",
        entityId: training.id,
        metadata: { title: training.title, category: training.category },
      });
      return json({ training: toTrainingDTO(training) }, { status: 201 });
    },
    { adminOnly: true }
  );
}
