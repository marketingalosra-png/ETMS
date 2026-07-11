"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Edit3, Film, Search, Trash2 } from "lucide-react";
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
import { trainingSchema } from "@/lib/validation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  completionCriteria: "WATCH_95_PERCENT",
  videoUrl: "",
};

// ---------------------------------------------------------------------------
// TrainingManager — Client Component
// Receives plain TrainingDTO objects from Server Components
// ---------------------------------------------------------------------------

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

  const form = useForm<TrainingInput>({
    resolver: zodResolver(
      trainingSchema.extend({
        videoUrl: z
          .string()
          .url()
          .or(z.string().regex(/^\/uploads\/[\w.-]+$/))
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
      // dueDate stored as ISO string — parse back to Date for the form
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

    const response = await fetch(
      editing ? `/api/trainings/${editing.id}` : "/api/trainings",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, videoUrl }),
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

  // Serializable rows for DataTable
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

  return (
    <div className="grid gap-4 xl:grid-cols-[0.85fr_1.4fr]">
      <Card>
        <CardHeader>
          <CardTitle>{editing ? "Edit Training" : "Create Training"}</CardTitle>
        </CardHeader>
        <form className="grid gap-3" onSubmit={form.handleSubmit(save)}>
          <Input placeholder="Title" {...form.register("title")} />
          <Textarea placeholder="Description" {...form.register("description")} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Category" {...form.register("category")} />
            <Input
              type="number"
              placeholder="Minutes"
              {...form.register("estimatedMinutes", { valueAsNumber: true })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              type="date"
              {...form.register("dueDate", { valueAsDate: true })}
            />
            <select
              className="h-10 rounded-lg border bg-card px-3 text-sm"
              {...form.register("priority")}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          <Input
            placeholder="Thumbnail URL"
            {...form.register("thumbnailUrl")}
          />
          <Input
            placeholder="Uploaded, YouTube, or external video URL"
            {...form.register("videoUrl")}
          />
          <label className="rounded-lg border border-dashed bg-muted/35 p-3 text-sm">
            <span className="font-medium">Upload MP4/video file</span>
            <input
              className="mt-2 block w-full text-sm"
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
            />
            {videoFile ? (
              <span className="mt-1 block text-xs text-muted-foreground">
                {videoFile.name}
              </span>
            ) : null}
          </label>
          <div className="flex gap-2">
            <Button className="flex-1">
              <Film className="h-4 w-4" />
              {editing ? "Save" : "Create"}
            </Button>
            {editing ? (
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
            ) : null}
          </div>
        </form>
      </Card>

      <div>
        <div className="mb-3 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search trainings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <DataTable
          data={tableRows}
          columns={[
            { key: "title", label: "Training", type: "text" },
            { key: "dueDate", label: "Due", type: "date" },
            { key: "priority", label: "Priority", type: "status" },
            { key: "video", label: "Video", type: "status" },
            { key: "assigned", label: "Assigned", type: "number" },
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
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  className="h-9 w-9 px-0"
                  onClick={() => setDeleteTarget(training)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          }}
        />
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete training?"
        description="This removes the course, assignments, and progress history for this training."
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
      />
    </div>
  );
}
