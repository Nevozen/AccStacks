import { AppError } from "@/lib/errors";
import { parseMoneyInput } from "@/lib/money";
import { currencySchema, moneyInputSchema } from "@/schemas/money";
import { settingsInputSchema, type SettingsInput } from "@/schemas/settings";
import { db } from "@/server/db";

export async function getSettings(userId: string) {
  const settings = await db.userSettings.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
  return {
    ...settings,
    currency: settings.currency === null ? null : currencySchema.parse(settings.currency),
  };
}

export async function requireCurrency(userId: string) {
  const { currency } = await getSettings(userId);
  if (!currency) throw new AppError("CONFLICT", "Choose your workspace currency first");
  return currency;
}

export async function chooseCurrency(userId: string, input: unknown) {
  const currency = currencySchema.parse(input);
  const { count } = await db.userSettings.updateMany({
    where: { userId, currency: null },
    data: { currency },
  });
  if (!count && (await getSettings(userId)).currency !== currency) {
    throw new AppError("CONFLICT", "Workspace currency is already set and cannot be changed");
  }
}

export async function updateSettings(userId: string, input: SettingsInput) {
  const currency = await requireCurrency(userId);
  const { capital, ...preferences } = settingsInputSchema(currency).parse(input);
  const data = {
    ...preferences,
    ...(capital !== undefined ? { capital: parseMoneyInput(capital, currency)! } : {}),
  };
  return db.userSettings.update({ where: { userId }, data });
}

export async function updateCapital(userId: string, input: string) {
  const currency = await requireCurrency(userId);
  const capital = moneyInputSchema(currency).parse(input);
  return db.userSettings.update({
    where: { userId },
    data: { capital: parseMoneyInput(capital, currency)! },
  });
}
