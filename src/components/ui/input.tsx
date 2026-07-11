import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border bg-card/70 px-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-lg border bg-card/70 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10",
        className
      )}
      {...props}
    />
  );
}
