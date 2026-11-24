"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ListingCard } from "./listing-card";
import type { ListingDto, ListingGroupDto } from "./types";

type StackStyle = React.CSSProperties &
  Record<"--stack-x" | "--stack-y" | "--stack-rotate" | "--stack-delay", string>;

export function ListingGroupExpansion({
  group,
  timezone,
  onClose,
  onEdit,
  onDelete,
  onMarkSold,
}: {
  group: ListingGroupDto;
  timezone: string;
  onClose: () => void;
  onEdit: (listing: ListingDto) => void;
  onDelete: (listing: ListingDto) => void;
  onMarkSold: (listing: ListingDto) => void;
}) {
  const [closing, setClosing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function closeAll() {
    setClosing(true);
    timer.current = setTimeout(onClose, 250);
  }

  function stackStyle(index: number): StackStyle {
    const center = (group.listings.length - 1) / 2;
    return {
      "--stack-x": `${(center - index) * 48}px`,
      "--stack-y": `${index * 10}px`,
      "--stack-rotate": `${(center - index) * -4}deg`,
      "--stack-delay": `${index * 65}ms`,
    };
  }

  return (
    <section
      className={cn(
        "col-span-full",
        closing ? "listing-restack-container" : "listing-unstack-container",
      )}
      aria-label={`Listings for ${group.account.accountName}`}
      data-testid="listing-group-expansion"
    >
      <div className="mb-3 flex items-start justify-between gap-3 rounded-lg border bg-card p-3">
        <div>
          <h2 className="text-sm font-semibold">{group.account.accountName}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {group.account.accountCode} · {group.account.gameName} · {group.listings.length} active
            marketplace listing{group.listings.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={closeAll} disabled={closing}>
          <X />
          Close all
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {group.listings.map((listing, index) => (
          <div
            key={listing.id}
            className={closing ? "listing-restack-item" : "listing-unstack-item"}
            style={stackStyle(index)}
          >
            <ListingCard
              listing={listing}
              timezone={timezone}
              onEdit={() => onEdit(listing)}
              onDelete={() => onDelete(listing)}
              onMarkSold={() => onMarkSold(listing)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
