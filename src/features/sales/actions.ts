"use server";

import { revalidatePath } from "next/cache";
import { actionError, type ActionResult } from "@/lib/action-result";
import type { SaleInput } from "@/schemas/sale";
import { confirmSale } from "@/services/sales";
import { requireActionUser } from "@/server/session";

export async function confirmSaleAction(input: SaleInput): Promise<ActionResult> {
  try {
    const user = await requireActionUser();
    await confirmSale(user.id, input);
    revalidatePath("/stocks");
    revalidatePath("/listings");
    revalidatePath("/overview");
    revalidatePath("/analytics");
    return {
      success: true,
      message: "Sale recorded. Remove any remaining external advertisements manually.",
    };
  } catch (error) {
    return actionError(error, "Unable to confirm sale");
  }
}
