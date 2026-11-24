import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="mt-2 text-xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The requested AccStacks page does not exist.
      </p>
      <Button asChild className="mt-5" variant="outline">
        <Link href="/overview">Return to Overview</Link>
      </Button>
    </main>
  );
}
