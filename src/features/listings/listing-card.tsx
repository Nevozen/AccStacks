"use client";

import { CalendarDays, CircleDollarSign, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { AccountThumbnail } from "@/components/shared/account-thumbnail";
import { Money } from "@/components/shared/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/dates";
import { formatPercentage } from "@/lib/money";
import type { ListingDto } from "./types";

export function ListingCard({
  listing,
  timezone,
  onEdit,
  onDelete,
  onMarkSold,
}: {
  listing: ListingDto;
  timezone: string;
  onEdit: () => void;
  onDelete: () => void;
  onMarkSold: () => void;
}) {
  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-start gap-3">
        <AccountThumbnail src={listing.account.imageUrl} alt="" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">{listing.account.gameName}</p>
              <h2 className="mt-0.5 truncate text-sm font-semibold">
                {listing.account.accountName}
              </h2>
            </div>
            <Badge variant="success">ACTIVE</Badge>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium">
            {listing.marketplace}
            {listing.listingUrl ? (
              <a
                href={listing.listingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
                aria-label={`Open ${listing.marketplace} advertisement`}
              >
                <ExternalLink className="size-3.5" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-muted-foreground">Purchase price</p>
          <Money className="mt-1 block" value={BigInt(listing.account.purchasePrice)} />
        </div>
        <div>
          <p className="text-muted-foreground">Listing price</p>
          <Money className="mt-1 block" value={BigInt(listing.listingPrice)} />
        </div>
        <div>
          <p className="text-muted-foreground">Estimated profit</p>
          <Money className="mt-1 block" value={BigInt(listing.estimatedProfit)} colored />
        </div>
        <div>
          <p className="text-muted-foreground">Estimated margin</p>
          <p className="mt-1 font-medium">{formatPercentage(listing.estimatedProfitMargin)}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t pt-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="size-3.5" />
          {formatDate(new Date(listing.listedAt), timezone)}
        </span>
        <span>
          {listing.daysListed} day{listing.daysListed === 1 ? "" : "s"} listed
        </span>
      </div>
      <div className="mt-3 border-t pt-3">
        <span className="text-[11px] text-muted-foreground">
          {listing.account.activeListingCount} listing
          {listing.account.activeListingCount === 1 ? "" : "s"} on this account
        </span>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={onMarkSold}>
            <CircleDollarSign />
            Mark as Sold
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 />
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}
