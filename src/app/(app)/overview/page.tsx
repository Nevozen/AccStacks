import type { Metadata } from "next";
import { Package, ReceiptText, Store } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/server/db";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage() {
  const user = await requireUser();
  const [accountCount, saleCount, activeListingCount] = await Promise.all([
    db.account.count({ where: { ownerId: user.id, deletedAt: null } }),
    db.sale.count({ where: { account: { ownerId: user.id } } }),
    db.listing.count({
      where: { status: "ACTIVE", account: { ownerId: user.id, deletedAt: null } },
    }),
  ]);
  const metrics = [
    { label: "Total accounts", value: accountCount, icon: Package },
    { label: "Active listings", value: activeListingCount, icon: Store },
    { label: "Completed sales", value: saleCount, icon: ReceiptText },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Overview" description="A live summary of your reseller workspace." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-muted-foreground">{label}</CardTitle>
              <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
