import { NextRequest, NextResponse } from "next/server";
import { deriveAccountStatus } from "@/lib/account-status";
import { searchAccounts } from "@/services/search";
import { getSessionUser } from "@/server/session";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const accounts = await searchAccounts(user.id, request.nextUrl.searchParams.get("q") ?? "");
  return NextResponse.json({
    accounts: accounts.map((account) => ({
      id: account.id,
      accountCode: account.accountCode,
      accountName: account.accountName,
      gameName: account.gameName,
      imageUrl: account.imageUrl,
      purchasePrice: account.purchasePrice.toString(),
      status: deriveAccountStatus({
        sold: Boolean(account.sale),
        activeListingCount: account._count.listings,
      }),
    })),
  });
}
