"use server";

import { revalidatePath } from "next/cache";
import { actionError, type ActionResult } from "@/lib/action-result";
import type { ListingInput, UpdateListingInput } from "@/schemas/listing";
import { cancelListing, createListing, updateListing } from "@/services/listings";
import { requireActionUser } from "@/server/session";

function revalidateListings() {
  revalidatePath("/stocks");
  revalidatePath("/listings");
  revalidatePath("/overview");
  revalidatePath("/analytics");
}

export async function createListingAction(input: ListingInput): Promise<ActionResult> {
  try {
    const user = await requireActionUser();
    await createListing(user.id, input);
    revalidateListings();
    return { success: true, message: "Marketplace listing created" };
  } catch (error) {
    return actionError(error, "Unable to create listing");
  }
}

export async function updateListingAction(
  listingId: string,
  input: UpdateListingInput,
): Promise<ActionResult> {
  try {
    const user = await requireActionUser();
    await updateListing(user.id, listingId, input);
    revalidateListings();
    return { success: true, message: "Listing updated" };
  } catch (error) {
    return actionError(error, "Unable to update listing");
  }
}

export async function cancelListingAction(listingId: string): Promise<ActionResult> {
  try {
    const user = await requireActionUser();
    await cancelListing(user.id, listingId);
    revalidateListings();
    return {
      success: true,
      message: "Listing cancelled. Remove the external advertisement manually.",
    };
  } catch (error) {
    return actionError(error, "Unable to cancel listing");
  }
}
