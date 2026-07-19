"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Lock } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { completionSchema } from "@/lib/validation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CompletionInput = z.infer<typeof completionSchema>;

// ---------------------------------------------------------------------------
// TrainingCompletionForm
// ---------------------------------------------------------------------------

export function TrainingCompletionForm({
  assignmentId,
  isAlreadyCompleted,
  existingLearningSummary,
  existingNotes,
}: {
  assignmentId: string;
  isAlreadyCompleted: boolean;
  existingLearningSummary?: string | null;
  existingNotes?: string | null;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(isAlreadyCompleted);

  const form = useForm<CompletionInput>({
    resolver: zodResolver(completionSchema),
    defaultValues: {
      learningSummary: existingLearningSummary ?? "",
      completionNotes: existingNotes ?? "",
    },
  });

  async function onSubmit(data: CompletionInput) {
    startTransition(async () => {
      const response = await fetch(`/api/assignments/${assignmentId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        toast.error(payload.error ?? "Failed to submit. Please try again.");
        return;
      }
      setSubmitted(true);
      toast.success("Training marked as complete! Your summary has been saved.");
    });
  }

  // ---- Already completed read-only view ----
  if (submitted) {
    return (
      <Card className="border-teal-500/30 bg-teal-500/5">
        <div className="flex items-start gap-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-teal-500/15">
            <CheckCircle2 className="h-5 w-5 text-teal-500" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-teal-500">Training Completed</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Your completion and learning summary have been submitted for review.
            </p>
            {existingLearningSummary && (
              <div className="mt-4 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Your Learning Summary
                </p>
                <p className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
                  {existingLearningSummary}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // ---- Unlocked form ----
  return (
    <Card>
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold">Complete Your Training</p>
          <p className="text-sm text-muted-foreground">
            Fill in your learning summary to finalise this training.
          </p>
        </div>
      </div>

      <form
        className="space-y-5"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
      >
        {/* Confirmation checkbox */}
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-card/60 p-4 transition hover:bg-muted/30">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-muted accent-primary"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            aria-describedby="confirm-desc"
            id="confirm-checkbox"
          />
          <span>
            <span className="text-sm font-medium">
              I confirm that I have completed watching this training.
            </span>
            <p
              id="confirm-desc"
              className="mt-0.5 text-xs text-muted-foreground"
            >
              By checking this box you confirm you have watched this training in
              full and understood its content.
            </p>
          </span>
        </label>

        <FormField
          label="What did you learn from this training?"
          htmlFor="learningSummary"
          required
          description="Describe the key takeaways and how you will apply them."
          error={form.formState.errors.learningSummary?.message}
        >
          <Textarea
            id="learningSummary"
            placeholder="Describe briefly what you learned..."
            aria-required="true"
            aria-describedby="learningSummary-desc learningSummary-error"
            {...form.register("learningSummary")}
          />
        </FormField>

        <FormField
          label="Additional Notes"
          htmlFor="completionNotes"
          description="Any comments, questions, or observations about this training."
          error={form.formState.errors.completionNotes?.message}
        >
          <Textarea
            id="completionNotes"
            placeholder="Optional notes, questions, or feedback..."
            aria-describedby="completionNotes-desc"
            {...form.register("completionNotes")}
          />
        </FormField>

        <Button
          type="submit"
          className="w-full"
          disabled={!confirmed || isPending}
          aria-label="Submit training completion"
        >
          <CheckCircle2 className="h-4 w-4" />
          {isPending ? "Submitting..." : "Submit Training"}
        </Button>
      </form>
    </Card>
  );
}
