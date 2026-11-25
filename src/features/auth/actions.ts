"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { actionError, type ActionResult } from "@/lib/action-result";
import { signIn } from "@/server/auth";
import { getAuthClientIdentifier } from "@/server/auth-throttle";
import { getSessionUser } from "@/server/session";
import { registerUser } from "@/services/registration";

export async function registerAction(
  _state: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  if (await getSessionUser()) redirect("/overview");

  const password = form.get("password");
  let email: string;
  try {
    const user = await registerUser(
      {
        name: form.get("name"),
        email: form.get("email"),
        password,
        confirmPassword: form.get("confirmPassword"),
      },
      getAuthClientIdentifier(await headers()),
    );
    email = user.email;
  } catch (error) {
    return actionError(error, "Unable to create your account. Please try again.");
  }

  try {
    await signIn("credentials", { email, password, redirect: false, redirectTo: "/overview" });
  } catch {
    redirect("/login?registered=1");
  }
  redirect("/overview");
}
