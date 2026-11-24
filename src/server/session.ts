import { redirect } from "next/navigation";
import { auth } from "./auth";

export async function getSessionUser() {
  const session = await auth();
  return session?.user.id ? session.user : null;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user?.id) redirect("/login");
  return user;
}

export async function requireActionUser() {
  const user = await getSessionUser();
  if (!user?.id) throw new Error("You must be signed in");
  return user;
}
