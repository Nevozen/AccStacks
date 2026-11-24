import { NextRequest, NextResponse } from "next/server";
import { toEligibleAccountDto } from "@/features/listings/dto";
import { getEligibleAccounts } from "@/services/listings";
import { getSessionUser } from "@/server/session";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const accounts = await getEligibleAccounts(user.id, request.nextUrl.searchParams.get("q") ?? "");
  return NextResponse.json({ accounts: accounts.map(toEligibleAccountDto) });
}
