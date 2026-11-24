import type { Metadata } from "next";
import { PackageOpen } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import { PageHeader } from "@/components/shared/page-header";
import { AccountStatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { deriveAccountStatus } from "@/lib/account-status";
import { db } from "@/server/db";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Stocks" };

export default async function StocksPage() {
  const user = await requireUser();
  const accounts = await db.account.findMany({
    where: { ownerId: user.id, deletedAt: null },
    include: {
      sale: { select: { id: true } },
      listings: { where: { status: "ACTIVE" }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stocks"
        description={`${accounts.length} account${accounts.length === 1 ? "" : "s"} in inventory.`}
      />
      {accounts.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title="No accounts yet"
          description="Purchased game accounts will appear in your inventory."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs text-muted-foreground">{account.gameName}</p>
                  <h2 className="mt-1 truncate font-medium">{account.accountName}</h2>
                </div>
                <AccountStatusBadge
                  status={deriveAccountStatus({
                    sold: Boolean(account.sale),
                    activeListingCount: account.listings.length,
                  })}
                />
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Purchase price</span>
                <Money value={account.purchasePrice} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
