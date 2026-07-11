import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const tones = {
  blue: "bg-blue-500/12 text-blue-600 dark:text-blue-300",
  teal: "bg-teal-500/12 text-teal-700 dark:text-teal-300",
  amber: "bg-amber-500/14 text-amber-700 dark:text-amber-300",
  red: "bg-red-500/12 text-red-700 dark:text-red-300",
  gray: "bg-muted text-muted-foreground"
};

export function Badge({ tone = "gray", className, children }: { tone?: keyof typeof tones; className?: string; children: ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone], className)}>{children}</span>;
}
