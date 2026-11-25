import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  variant = "panel",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
  variant?: "panel" | "inline";
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3",
        variant === "panel" && "rounded-xl border bg-card p-panel sm:px-5 sm:py-6",
        className,
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-48 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
      {action ? <div className="max-w-full">{action}</div> : null}
    </div>
  );
}
