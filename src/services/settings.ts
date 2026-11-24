import { settingsInputSchema, type SettingsInput } from "@/schemas/settings";
import { db } from "@/server/db";

export async function getSettings(userId: string) {
  return db.userSettings.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

export async function updateSettings(userId: string, input: SettingsInput) {
  const data = settingsInputSchema.parse(input);
  return db.userSettings.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
}
