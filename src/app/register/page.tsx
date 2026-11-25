import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/features/auth/auth-shell";
import { RegisterForm } from "@/features/auth/register-form";
import { getSessionUser } from "@/server/session";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage() {
  if (await getSessionUser()) redirect("/overview");

  return (
    <AuthShell
      title="Create your AccStacks account"
      description="Start a private workspace for your game account business."
    >
      <RegisterForm />
    </AuthShell>
  );
}
