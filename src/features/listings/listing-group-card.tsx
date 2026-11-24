"use client";

import { Layers3 } from "lucide-react";
import { AccountThumbnail } from "@/components/shared/account-thumbnail";
import { Money } from "@/components/shared/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { calculateListingMetrics } from "@/lib/finance";
import { formatPercentage } from "@/lib/money";
import type { ListingGroupDto } from "./types";

export function ListingGroupCard({
  group,
  onShowAll,
}: {
  group: ListingGroupDto;
  onShowAll: () => void;
}) {
  const representative = group.listings.reduce((highest, listing) =>
    BigInt(listing.listingPrice) > BigInt(highest.listingPrice) ? listing : highest,
  );
  const metrics = calculateListingMetrics({
    listingPrice: BigInt(representative.listingPrice),
    purchasePrice: BigInt(group.account.purchasePrice),
  });
  const count = group.listings.length;

  return (
    <div className="relative">
      {count > 1 ? (
        <>
          <div
            className="absolute inset-x-3 top-2 -bottom-2 rounded-xl border bg-card/70"
            aria-hidden="true"
          />
          <div
            className="absolute inset-x-1.5 top-1 -bottom-1 rounded-xl border bg-card/85"
            aria-hidden="true"
          />
        </>
      ) : null}
      <Card className="relative p-4" data-testid="listing-account-card">
        <div className="flex items-start gap-3">
          <AccountThumbnail src={group.account.imageUrl} alt="" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">{group.account.gameName}</p>
                <h2 className="mt-0.5 truncate text-sm font-semibold">
                  {group.account.accountName}
                </h2>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                  {group.account.accountCode}
                </p>
              </div>
              <Badge variant="info">{count} active</Badge>
            </div>
          </div>
        </div>
        <p className="mt-3 line-clamp-2 min-h-8 text-xs text-muted-foreground">
          {group.account.description || "No account description."}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground">Purchase price</p>
            <Money className="mt-1 block" value={BigInt(group.account.purchasePrice)} />
          </div>
          <div>
            <p className="text-muted-foreground">Highest asking price</p>
            <Money className="mt-1 block" value={BigInt(representative.listingPrice)} />
          </div>
          <div>
            <p className="text-muted-foreground">Best estimated profit</p>
            <Money className="mt-1 block" value={metrics.estimatedProfit} colored />
          </div>
          <div>
            <p className="text-muted-foreground">Estimated margin</p>
            <p className="mt-1 font-medium">{formatPercentage(metrics.estimatedProfitMargin)}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5 border-t pt-3">
          {group.listings.map((listing) => (
            <span key={listing.id} className="rounded bg-secondary px-2 py-1 text-[10px]">
              {listing.marketplace} · {listing.listingCode}
            </span>
          ))}
        </div>
        <Button className="mt-4 w-full" variant="outline" onClick={onShowAll}>
          <Layers3 />
          Show all listings ({count})
        </Button>
      </Card>
    </div>
  );
}
