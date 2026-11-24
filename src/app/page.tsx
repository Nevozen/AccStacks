import { Layers3 } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg border bg-card">
          <Layers3 className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-lg font-semibold tracking-tight">AccStacks</p>
          <p className="text-sm text-muted-foreground">Stack Accounts. Track Profits.</p>
        </div>
      </div>
    </main>
  );
}
