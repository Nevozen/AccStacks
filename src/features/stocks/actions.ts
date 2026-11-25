"use server";

import { revalidatePath } from "next/cache";
import type { StockView } from "@/generated/prisma/client";
import { actionError, type ActionResult } from "@/lib/action-result";
import type { AccountInput } from "@/schemas/account";
import { archiveAccount, createAccount, updateAccount } from "@/services/accounts";
import { db } from "@/server/db";
import { requireActionUser } from "@/server/session";

function revalidateInventory() {
  revalidatePath("/stocks");
  revalidatePath("/listings");
  revalidatePath("/overview");
  revalidatePath("/analytics");
}

export async function createAccountAction(input: AccountInput): Promise<ActionResult> {
  try {
    const user = await requireActionUser();
    const account = await createAccount(user.id, input);
    revalidateInventory();
    return { success: true, message: "Account added to Stocks", accountId: account.id };
  } catch (error) {
    return actionError(error, "Unable to create account");
  }
}

export async function updateAccountAction(
  accountId: string,
  input: AccountInput,
): Promise<ActionResult> {
  try {
    const user = await requireActionUser();
    const account = await updateAccount(user.id, accountId, input);
    revalidateInventory();
    return { success: true, message: "Account updated", accountId: account.id };
  } catch (error) {
    return actionError(error, "Unable to update account");
  }
}

export async function archiveAccountAction(accountId: string): Promise<ActionResult> {
  try {
    const user = await requireActionUser();
    await archiveAccount(user.id, accountId);
    revalidateInventory();
    return { success: true, message: "Account archived" };
  } catch (error) {
    return actionError(error, "Unable to delete account");
  }
}

export async function setStockViewAction(view: StockView) {
  const user = await requireActionUser();
  await db.userSettings.upsert({
    where: { userId: user.id },
    update: { preferredStockView: view },
    create: { userId: user.id, preferredStockView: view },
  });
}
