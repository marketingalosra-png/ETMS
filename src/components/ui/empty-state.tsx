import { cn } from "@/lib/utils";
import type { ComponentType, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: { label: string; href?: string; onClick?: () => void };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-64 flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-muted/20 py-12 text-center",
        className
      )}
    >
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-muted/60">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="max-w-xs space-y-1">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action && (
        <div className="mt-2">
          {action.href ? (
            <Link href={action.href}>
              <Button size="sm" variant="secondary">
                {action.label}
              </Button>
            </Link>
          ) : (
            <Button size="sm" variant="secondary" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
