import { Prisma } from "@/generated/prisma/client";
import { dateInputToUtc } from "@/lib/dates";
import { AppError } from "@/lib/errors";
import { calculateSaleMetrics } from "@/lib/finance";
import { saleInputSchema, type SaleInput } from "@/schemas/sale";
import { db } from "@/server/db";

export async function confirmSale(ownerId: string, input: SaleInput) {
  const data = saleInputSchema.parse(input);
  const sellingPrice = BigInt(data.sellingPrice);
  const soldAt = dateInputToUtc(data.soldAt);
  const expenseAmounts = data.expenses.map((expense) => BigInt(expense.amount));

  async function execute() {
    return db.$transaction(
      async (tx) => {
        const locked = await tx.$queryRaw<{ id: string }[]>`
          SELECT a.id FROM "Account" a
          JOIN "Listing" l ON l."accountId" = a.id
          WHERE l.id = ${data.listingId}
            AND a."ownerId" = ${ownerId}
            AND a."deletedAt" IS NULL
          FOR UPDATE OF a
        `;
        if (locked.length === 0)
          throw new AppError("NOT_FOUND", "Account or active listing not found");
        const accountId = locked[0]!.id;
        const account = await tx.account.findUnique({
          where: { id: accountId },
          include: { sale: { select: { id: true } } },
        });
        if (!account) throw new AppError("NOT_FOUND", "Account not found");
        if (account.sale) throw new AppError("CONFLICT", "This account has already been sold");
        const listing = await tx.listing.findFirst({
          where: { id: data.listingId, accountId, status: "ACTIVE", account: { ownerId } },
        });
        if (!listing) throw new AppError("NOT_FOUND", "Active listing not found");

        const metrics = calculateSaleMetrics({
          sellingPrice,
          purchasePrice: account.purchasePrice,
          expenses: expenseAmounts,
        });
        const closedAt = new Date();
        const sale = await tx.sale.create({
          data: {
            accountId: account.id,
            listingId: listing.id,
            marketplace: listing.marketplace,
            marketplaceNormalized: listing.marketplaceNormalized,
            purchasePrice: account.purchasePrice,
            originalListingPrice: listing.listingPrice,
            sellingPrice,
            totalExpenses: metrics.totalExpenses,
            netProfit: metrics.netProfit,
            soldAt,
            notes: data.notes?.trim() || null,
            expenses: {
              create: data.expenses.map((expense, index) => ({
                name: expense.name,
                amount: expenseAmounts[index]!,
              })),
            },
          },
          include: { expenses: true },
        });
        await tx.listing.update({
          where: { id: listing.id },
          data: { status: "SOLD", closedAt },
        });
        await tx.listing.updateMany({
          where: { accountId: account.id, status: "ACTIVE", id: { not: listing.id } },
          data: { status: "CLOSED", closedAt },
        });
        return sale;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10_000,
        timeout: 20_000,
      },
    );
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await execute();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError("CONFLICT", "This account has already been sold");
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
        if (attempt === 0) continue;
        throw new AppError(
          "CONFLICT",
          "A concurrent transaction changed this account. Refresh and try again.",
        );
      }
      throw error;
    }
  }
  throw new AppError("CONFLICT", "Unable to complete the sale safely");
}
