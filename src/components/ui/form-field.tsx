import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// RequiredBadge / OptionalBadge
// ---------------------------------------------------------------------------

export function RequiredBadge() {
  return (
    <span className="ml-1.5 inline-flex items-center rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-500">
      Required
    </span>
  );
}

export function OptionalBadge() {
  return (
    <span className="ml-1.5 inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      Optional
    </span>
  );
}

// ---------------------------------------------------------------------------
// FieldDescription
// ---------------------------------------------------------------------------

export function FieldDescription({
  id,
  children,
  className,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      id={id}
      className={cn("mt-1 text-xs text-muted-foreground", className)}
    >
      {children}
    </p>
  );
}

// ---------------------------------------------------------------------------
// FieldError
// ---------------------------------------------------------------------------

export function FieldError({
  id,
  message,
}: {
  id?: string;
  message?: string;
}) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-xs font-medium text-red-500">
      {message}
    </p>
  );
}

// ---------------------------------------------------------------------------
// FormField — main wrapper
// ---------------------------------------------------------------------------

export function FormField({
  label,
  htmlFor,
  required,
  description,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  description?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  const descId = htmlFor ? `${htmlFor}-desc` : undefined;
  const errId = htmlFor ? `${htmlFor}-error` : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center">
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium leading-none"
        >
          {label}
        </label>
        {required ? <RequiredBadge /> : <OptionalBadge />}
      </div>

      {/* Clone children to inject aria attributes */}
      <div
        data-field-input
        aria-describedby={
          [descId, errId].filter(Boolean).join(" ") || undefined
        }
      >
        {children}
      </div>

      {description && !error && (
        <FieldDescription id={descId}>{description}</FieldDescription>
      )}

      <FieldError id={errId} message={error} />
    </div>
  );
}
