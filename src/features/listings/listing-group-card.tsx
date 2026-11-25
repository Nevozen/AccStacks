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
    <div className="relative listing-stack-summary">
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
      <Card className="relative p-panel" data-testid="listing-account-card">
        <div className="flex items-start gap-3">
          <AccountThumbnail src={group.account.imageUrl} alt="" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold" title={group.account.accountName}>
                  {group.account.accountName}
                </h2>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {group.account.gameName}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                  {group.account.accountCode}
                </p>
              </div>
              <Badge variant="info">{count} active</Badge>
            </div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground">Highest asking price</p>
            <Money
              className="mt-0.5 block text-base font-semibold wrap-anywhere"
              value={BigInt(representative.listingPrice)}
            />
          </div>
          <div>
            <p className="text-muted-foreground">Best estimated profit</p>
            <Money
              className="mt-0.5 block text-base font-semibold wrap-anywhere"
              value={metrics.estimatedProfit}
              colored
            />
          </div>
          <div>
            <p className="text-muted-foreground">Purchase price</p>
            <Money
              className="mt-0.5 block wrap-anywhere"
              value={BigInt(group.account.purchasePrice)}
            />
          </div>
          <div>
            <p className="text-muted-foreground">Estimated margin</p>
            <p className="mt-0.5 font-medium tabular-nums">
              {formatPercentage(metrics.estimatedProfitMargin)}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5 border-t pt-3">
          {group.listings.slice(0, 3).map((listing) => (
            <span
              key={listing.id}
              className="rounded-sm bg-muted px-2 py-1 text-[11px] wrap-anywhere"
            >
              {listing.marketplace} · {listing.listingCode}
            </span>
          ))}
          {count > 3 ? (
            <span className="px-1 py-1 text-xs text-muted-foreground">+{count - 3} more</span>
          ) : null}
        </div>
        <Button className="mt-3" variant="outline" size="sm" onClick={onShowAll}>
          <Layers3 />
          Show all listings ({count})
        </Button>
      </Card>
    </div>
  );
}
