import Link from "next/link";
import { Layers3 } from "lucide-react";

export function PublicBrand() {
  return (
    <Link
      href="/"
      className="inline-flex w-fit shrink-0 items-center gap-2 rounded-lg font-semibold tracking-[-0.045em] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Layers3 className="size-4" aria-hidden="true" />
      </span>
      AccStacks
    </Link>
  );
}
