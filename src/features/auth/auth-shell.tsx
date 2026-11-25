import type { ReactNode } from "react";
import { PublicBrand } from "@/components/layout/public-brand";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background bg-[radial-gradient(ellipse_at_top,rgba(171,224,174,0.22),transparent_58%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(69,124,89,0.14),transparent_58%)]">
      <header className="mx-auto w-full max-w-6xl px-5 py-5 sm:px-8">
        <PublicBrand />
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-8 sm:py-12">
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
          <div className="mt-6">{children}</div>
        </div>
      </main>
      <footer className="px-5 py-5 text-center text-xs text-muted-foreground">
        Developed by Wardana Dev
      </footer>
    </div>
  );
}
