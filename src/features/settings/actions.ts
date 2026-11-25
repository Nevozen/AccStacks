"use server";

import { revalidatePath } from "next/cache";
import { actionError, type ActionResult } from "@/lib/action-result";
import type { SettingsInput } from "@/schemas/settings";
import { chooseCurrency, updateCapital, updateSettings } from "@/services/settings";
import { requireActionUser } from "@/server/session";

export async function chooseCurrencyAction(currency: string): Promise<ActionResult> {
  try {
    const user = await requireActionUser();
    await chooseCurrency(user.id, currency);
    return { success: true, message: "Workspace currency saved" };
  } catch (error) {
    return actionError(error, "Unable to set currency");
  }
}

export async function updateCapitalAction(capital: string): Promise<ActionResult> {
  try {
    const user = await requireActionUser();
    await updateCapital(user.id, capital);
    revalidatePath("/settings");
    revalidatePath("/overview");
    revalidatePath("/analytics");
    return { success: true, message: "Starting capital saved" };
  } catch (error) {
    return actionError(error, "Unable to save capital");
  }
}

export async function updateSettingsAction(input: SettingsInput): Promise<ActionResult> {
  try {
    const user = await requireActionUser();
    await updateSettings(user.id, input);
    revalidatePath("/settings");
    revalidatePath("/stocks");
    revalidatePath("/overview");
    revalidatePath("/analytics");
    revalidatePath("/listings");
    return { success: true, message: "Workspace settings saved" };
  } catch (error) {
    return actionError(error, "Unable to save settings");
  }
}
