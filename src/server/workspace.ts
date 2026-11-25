import { cache } from "react";
import { requireUser } from "@/server/session";
import { getSettings } from "@/services/settings";

export const getWorkspace = cache(async () => {
  const user = await requireUser();
  return { user, settings: await getSettings(user.id) };
});
