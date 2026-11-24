import { Layers3, LogOut } from "lucide-react";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/server/auth";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <section className="w-full max-w-md rounded-xl border border-black/10 bg-card p-6 dark:border-white/10">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg border border-black/10 dark:border-white/10">
            <Layers3 className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">AccStacks</h1>
            <p className="text-sm text-muted-foreground">Stack Accounts. Track Profits.</p>
          </div>
        </div>
        <p className="mt-6 text-sm">Signed in as {session.user.name ?? session.user.email}</p>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            className="mt-4 flex h-9 items-center gap-2 rounded-md border border-black/10 px-3 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
            type="submit"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}
