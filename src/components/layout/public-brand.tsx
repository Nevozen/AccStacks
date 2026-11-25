import Link from "next/link";
import { Layers3 } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-mark text-brand-mark-foreground",
        className,
      )}
    >
      <Layers3 className="size-4" aria-hidden="true" />
    </span>
  );
}

export function PublicBrand() {
  return (
    <Link
      href="/"
      className="inline-flex w-fit shrink-0 items-center gap-2 rounded-lg font-semibold tracking-[-0.045em]"
    >
      <BrandMark className="rounded-[10px]" />
      AccStacks
    </Link>
  );
}
