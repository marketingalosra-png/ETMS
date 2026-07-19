"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Edit3, Film, Search, Trash2, GraduationCap } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import type { TrainingDTO } from "@/lib/dto";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input, Textarea } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { EmptyState } from "@/components/ui/empty-state";
import { trainingSchema } from "@/lib/validation";

type TrainingInput = z.infer<typeof trainingSchema> & { videoUrl?: string };

const defaults: TrainingInput = {
  title: "",
  description: "",
  category: "General",
  difficulty: "BEGINNER",
  estimatedMinutes: 30,
  dueDate: null,
  thumbnailUrl: "",
  priority: "MEDIUM",
  status: "PUBLISHED",
  tags: [],
  completionCriteria: "PASS_ACKNOWLEDGEMENT",
  videoUrl: "",
};

export function TrainingManager({
  initialTrainings,
}: {
  initialTrainings: TrainingDTO[];
}) {
  const [trainings, setTrainings] = useState(initialTrainings);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<TrainingDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TrainingDTO | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // Must match server-side validation
  const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i;
  const isSupportedVideoUrl = (url: string) =>
    url.startsWith("/uploads/") ||
    VIDEO_EXTENSIONS.test(url) ||
    url.includes("youtube.com") ||
    url.includes("youtu.be") ||
    url.includes("vimeo.com") ||
    url.includes(".m3u8") ||
    url.includes(".mpd") ||
    url.includes("cloudflarestream.com") ||
    url.includes("mux.com") ||
    url.includes("cloudinary.com");

  const form = useForm<TrainingInput>({
    resolver: zodResolver(
      trainingSchema.extend({
        videoUrl: z
          .string()
          .refine(
            (val) => val === "" || isSupportedVideoUrl(val),
            "Unsupported video source. Use MP4, WebM, OGG, YouTube, Vimeo, or a supported CDN/streaming provider."
          )
          .optional()
          .or(z.literal("")),
      })
    ),
    defaultValues: defaults,
  });

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return trainings.filter((t) =>
      [t.title, t.category, t.description].some((v) =>
        v.toLowerCase().includes(term)
      )
    );
  }, [search, trainings]);

  function edit(training: TrainingDTO) {
    setEditing(training);
    form.reset({
      title: training.title,
      description: training.description,
      category: training.category,
      difficulty: training.difficulty as TrainingInput["difficulty"],
      estimatedMinutes: training.estimatedMinutes,
      dueDate: training.dueDate ? new Date(training.dueDate) : null,
      thumbnailUrl: training.thumbnailUrl ?? "",
      priority: training.priority as TrainingInput["priority"],
      status: training.status as TrainingInput["status"],
      tags: training.tags,
      completionCriteria:
        training.completionCriteria as TrainingInput["completionCriteria"],
      videoUrl: training.assets[0]?.url ?? "",
    });
  }

  async function save(input: TrainingInput) {
    let videoUrl = input.videoUrl;
    if (videoFile) {
      const upload = new FormData();
      upload.append("file", videoFile);
      const uploadResponse = await fetch("/api/uploads/video", {
        method: "POST",
        body: upload,
      });
      if (!uploadResponse.ok) return toast.error("Video upload failed");
      const uploaded = (await uploadResponse.json()) as { url: string };
      videoUrl = uploaded.url;
    }

    // Format dates to avoid next/prisma parsing issues
    const bodyData = {
      ...input,
      videoUrl,
      dueDate: input.dueDate ? input.dueDate.toISOString() : null,
    };

    const response = await fetch(
      editing ? `/api/trainings/${editing.id}` : "/api/trainings",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      }
    );
    if (!response.ok) return toast.error("Training save failed");
    const payload = (await response.json()) as { training: TrainingDTO };
    setTrainings((current) =>
      editing
        ? current.map((item) =>
            item.id === payload.training.id
              ? { ...item, ...payload.training }
              : item
          )
        : [payload.training, ...current]
    );
    setEditing(null);
    setVideoFile(null);
    form.reset(defaults);
    toast.success(editing ? "Training updated" : "Training created");
  }

  async function remove() {
    if (!deleteTarget) return;
    const response = await fetch(`/api/trainings/${deleteTarget.id}`, {
      method: "DELETE",
    });
    if (!response.ok) return toast.error("Delete failed");
    setTrainings((current) =>
      current.filter((item) => item.id !== deleteTarget.id)
    );
    setDeleteTarget(null);
    toast.success("Training deleted");
  }

  type TrainingRow = {
    id: string;
    title: string;
    category: string;
    dueDate: string;
    priority: string;
    video: string;
    assigned: number;
  };

  const tableRows: TrainingRow[] = filtered.map((t) => ({
    id: t.id,
    title: t.title,
    category: t.category,
    dueDate: t.dueDate ?? "",
    priority: t.priority,
    video: t.assets.length ? t.assets[0].type.replace("VIDEO_", "") : "No video",
    assigned: t.assignmentCount,
  }));

  const formErrors = form.formState.errors;

  return (
    <div className="grid gap-4 xl:grid-cols-[0.85fr_1.4fr]">
      <Card>
        <CardHeader>
          <CardTitle>{editing ? "Edit Training" : "Create Training"}</CardTitle>
        </CardHeader>
        <form className="grid gap-4 p-4 pt-0" onSubmit={form.handleSubmit(save)} noValidate>
          <FormField
            label="Training Title"
            htmlFor="title"
            required
            description="The official name of the training course."
            error={formErrors.title?.message}
          >
            <Input
              id="title"
              placeholder="e.g. Fire Safety Essentials"
              aria-required="true"
              {...form.register("title")}
            />
          </FormField>

          <FormField
            label="Description"
            htmlFor="description"
            required
            description="Explain what employees will learn from this training."
            error={formErrors.description?.message}
          >
            <Textarea
              id="description"
              placeholder="Provide a detailed course description..."
              aria-required="true"
              {...form.register("description")}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Category"
              htmlFor="category"
              required
              description="Examples: Safety, HR, General, Technical."
              error={formErrors.category?.message}
            >
              <Input
                id="category"
                placeholder="e.g. Safety"
                aria-required="true"
                {...form.register("category")}
              />
            </FormField>

            <FormField
              label="Estimated Duration (minutes)"
              htmlFor="estimatedMinutes"
              required
              description="Expected training duration in minutes."
              error={formErrors.estimatedMinutes?.message}
            >
              <Input
                id="estimatedMinutes"
                type="number"
                placeholder="e.g. 30"
                aria-required="true"
                {...form.register("estimatedMinutes", { valueAsNumber: true })}
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Due Date"
              htmlFor="dueDate"
              description="Optional deadline date for this training."
              error={formErrors.dueDate?.message}
            >
              <Input
                id="dueDate"
                type="date"
                {...form.register("dueDate", {
                  setValueAs: (v) => (v === "" ? null : new Date(v)),
                })}
              />
            </FormField>

            <FormField
              label="Priority"
              htmlFor="priority"
              description="Low = optional. Medium = recommended. High = mandatory."
              error={formErrors.priority?.message}
            >
              <select
                id="priority"
                className="h-10 w-full rounded-lg border bg-card px-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                {...form.register("priority")}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </FormField>
          </div>

          <FormField
            label="Thumbnail URL"
            htmlFor="thumbnailUrl"
            description="Image displayed in course card."
            error={formErrors.thumbnailUrl?.message}
          >
            <Input
              id="thumbnailUrl"
              placeholder="e.g. https://domain.com/image.png"
              {...form.register("thumbnailUrl")}
            />
          </FormField>

          <FormField
            label="Video URL"
            htmlFor="videoUrl"
            description="Supports MP4, YouTube, Vimeo or external video link."
            error={formErrors.videoUrl?.message}
          >
            <Input
              id="videoUrl"
              placeholder="Paste YouTube, MP4 or external video URL..."
              {...form.register("videoUrl")}
            />
          </FormField>

          <FormField
            label="Upload MP4 / Video File"
            htmlFor="videoUpload"
            description="Upload local video file if not hosting externally."
          >
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/20 p-4 transition hover:bg-muted/40">
              <span className="text-sm font-medium text-muted-foreground">Click to upload file</span>
              <input
                id="videoUpload"
                className="mt-2 block w-full text-xs text-muted-foreground"
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
              />
              {videoFile && (
                <span className="mt-2 text-xs font-semibold text-primary">
                  Selected: {videoFile.name}
                </span>
              )}
            </label>
          </FormField>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1">
              <Film className="h-4 w-4" />
              {editing ? "Save Changes" : "Create Training"}
            </Button>
            {editing && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditing(null);
                  form.reset(defaults);
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search trainings by title, category, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {tableRows.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No trainings found"
            description="We couldn't find any trainings matching your criteria. Try adjusting your search query or add a new training course."
            action={
              search
                ? { label: "Clear Search", onClick: () => setSearch("") }
                : undefined
            }
          />
        ) : (
          <DataTable
            data={tableRows}
            columns={[
              { key: "title", label: "Training", type: "text" },
              { key: "dueDate", label: "Due", type: "date" },
              { key: "priority", label: "Priority", type: "status" },
              { key: "video", label: "Video Type", type: "status" },
              { key: "assigned", label: "Assigned Count", type: "number" },
            ]}
            renderActions={(row) => {
              const training = trainings.find((t) => t.id === row.id);
              if (!training) return null;
              return (
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    className="h-9 w-9 px-0"
                    onClick={() => edit(training)}
                    title="Edit training"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-9 w-9 px-0 text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteTarget(training)}
                    title="Delete training"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            }}
          />
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete training?"
        description="This removes the course, assignments, and progress history for this training. This action cannot be undone."
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
      />
    </div>
  );
}
