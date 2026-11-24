import type { Metadata } from "next";
import { Store } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { db } from "@/server/db";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Listings" };

export default async function ListingsPage() {
  const user = await requireUser();
  const listings = await db.listing.findMany({
    where: { status: "ACTIVE", account: { ownerId: user.id, deletedAt: null, sale: null } },
    include: { account: { select: { gameName: true, accountName: true } } },
    orderBy: { listedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Listings"
        description={`${listings.length} active marketplace listing${listings.length === 1 ? "" : "s"}.`}
      />
      {listings.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No active listings"
          description="Marketplace advertisements for unsold accounts will appear here."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing) => (
            <Card key={listing.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs text-muted-foreground">
                    {listing.account.gameName}
                  </p>
                  <h2 className="mt-1 truncate font-medium">{listing.account.accountName}</h2>
                </div>
                <Badge variant="success">ACTIVE</Badge>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{listing.marketplace}</span>
                <Money value={listing.listingPrice} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
