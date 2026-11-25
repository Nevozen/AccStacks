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
    <Card className="flex flex-col p-panel" data-testid="listing-card">
      <div className="flex items-center gap-3">
        <AccountThumbnail src={listing.account.imageUrl} alt="" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold" title={listing.account.accountName}>
                {listing.account.accountName}
              </h2>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {listing.account.gameName}
              </p>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-xs font-medium">
            <span className="wrap-anywhere">{listing.marketplace}</span>
            <span className="font-mono text-[11px] wrap-anywhere text-muted-foreground">
              {listing.listingCode}
            </span>
            {listing.listingUrl ? (
              <a
                href={listing.listingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="grid size-6 place-items-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={`Open ${listing.marketplace} advertisement`}
              >
                <ExternalLink className="size-3.5" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-muted-foreground">Asking price</p>
          <Money
            className="mt-0.5 block text-base font-semibold wrap-anywhere"
            value={BigInt(listing.listingPrice)}
          />
        </div>
        <div>
          <p className="text-muted-foreground">Estimated profit</p>
          <Money
            className="mt-0.5 block text-base font-semibold wrap-anywhere"
            value={BigInt(listing.estimatedProfit)}
            colored
          />
        </div>
        <div>
          <p className="text-muted-foreground">Purchase price</p>
          <Money
            className="mt-0.5 block wrap-anywhere"
            value={BigInt(listing.account.purchasePrice)}
          />
        </div>
        <div>
          <p className="text-muted-foreground">Estimated margin</p>
          <p className="mt-0.5 font-medium tabular-nums">
            {formatPercentage(listing.estimatedProfitMargin)}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="size-3.5" aria-hidden="true" />
          {formatDate(new Date(listing.listedAt), timezone)}
        </span>
        <span>
          {listing.daysListed} day{listing.daysListed === 1 ? "" : "s"} listed
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={onMarkSold}>
          <CircleDollarSign />
          Mark as Sold
        </Button>
        <Button variant="ghost" size="sm" onClick={onEdit}>
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
    </Card>
  );
}
