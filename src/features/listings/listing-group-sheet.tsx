"use client";

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { ListingCard } from "./listing-card";
import type { ListingDto, ListingGroupDto } from "./types";

export function ListingGroupSheet({
  group,
  timezone,
  onClose,
  onEdit,
  onDelete,
  onMarkSold,
}: {
  group: ListingGroupDto | null;
  timezone: string;
  onClose: () => void;
  onEdit: (listing: ListingDto) => void;
  onDelete: (listing: ListingDto) => void;
  onMarkSold: (listing: ListingDto) => void;
}) {
  return (
    <Sheet open={Boolean(group)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="gap-4 sm:max-w-2xl">
        {group ? (
          <>
            <div className="pr-8">
              <SheetTitle>{group.account.accountName}</SheetTitle>
              <SheetDescription>
                {group.account.accountCode} · {group.account.gameName} · {group.listings.length}{" "}
                active marketplace listing{group.listings.length === 1 ? "" : "s"}. Each listing
                remains independent.
              </SheetDescription>
            </div>
            <div className="space-y-3">
              {group.listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  timezone={timezone}
                  onEdit={() => onEdit(listing)}
                  onDelete={() => onDelete(listing)}
                  onMarkSold={() => onMarkSold(listing)}
                />
              ))}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
