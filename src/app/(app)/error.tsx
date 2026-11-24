"use client";

import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ApplicationError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <CircleAlert className="mb-3 size-8 text-destructive" aria-hidden="true" />
      <h1 className="text-lg font-semibold">Unable to load this workspace</h1>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        The request did not complete. Your records have not been changed by this page load.
      </p>
      <Button className="mt-4" variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
