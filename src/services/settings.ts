import { moneyInputSchema } from "@/schemas/account";
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
  const { capital, ...preferences } = settingsInputSchema.parse(input);
  const data = { ...preferences, ...(capital !== undefined ? { capital: BigInt(capital) } : {}) };
  return db.userSettings.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
}

export async function updateCapital(userId: string, input: string) {
  const capital = moneyInputSchema.parse(input);
  return db.userSettings.upsert({
    where: { userId },
    update: { capital: BigInt(capital) },
    create: { userId, capital: BigInt(capital) },
  });
}
