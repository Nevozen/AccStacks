import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/features/auth/auth-shell";
import { LoginForm } from "@/features/auth/login-form";
import { getSessionUser } from "@/server/session";

export const metadata: Metadata = { title: "Sign in" };

function loginDestination(callbackUrl: string | string[] | undefined) {
  if (typeof callbackUrl === "string" && callbackUrl.startsWith("/")) {
    const origin = "https://accstacks.invalid";
    const url = URL.parse(callbackUrl, origin);
    if (url?.origin === origin && !url.pathname.startsWith("//")) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  }
  return "/overview";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[]; registered?: string }>;
}) {
  if (await getSessionUser()) redirect("/overview");
  const { callbackUrl, registered } = await searchParams;

  return (
    <AuthShell
      title="Sign in to AccStacks"
      description="Return to your private reseller workspace."
    >
      {registered === "1" ? (
        <p className="mb-4 rounded-lg border bg-secondary px-3 py-2 text-sm" role="status">
          Account created. Sign in to open your workspace.
        </p>
      ) : null}
      <LoginForm callbackUrl={loginDestination(callbackUrl)} />
    </AuthShell>
  );
}
