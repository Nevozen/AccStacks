"use client";

import Link from "next/link";
import { CalendarDays, Eye, MoreHorizontal, Pencil, Store, Trash2 } from "lucide-react";
import { AccountThumbnail } from "@/components/shared/account-thumbnail";
import { Money } from "@/components/shared/money";
import { AccountStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/dates";
import { cn, truncateMiddle } from "@/lib/utils";
import type { StockAccountDto } from "./types";

export function AccountCard({
  account,
  timezone,
  onView,
  onEdit,
  onDelete,
}: {
  account: StockAccountDto;
  timezone: string;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const sold = account.status === "SOLD";
  return (
    <Card className={cn("relative overflow-hidden p-4", sold && "bg-muted/60")}>
      {sold ? (
        <span
          className="pointer-events-none absolute right-3 bottom-1 text-6xl font-bold tracking-tight text-foreground/5"
          aria-hidden="true"
        >
          SOLD
        </span>
      ) : null}
      <div className="relative flex items-start gap-3">
        <AccountThumbnail src={account.imageUrl} alt="" className={cn(sold && "grayscale")} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">{account.gameName}</p>
              <h2 className="mt-0.5 truncate text-sm font-semibold">{account.accountName}</h2>
            </div>
            <AccountStatusBadge status={account.status} />
          </div>
          <p className="mt-2 line-clamp-2 min-h-8 text-xs text-muted-foreground">
            {account.description || "No account description."}
          </p>
        </div>
      </div>
      <div className="relative mt-4 space-y-2 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Purchase price</span>
          <Money value={BigInt(account.purchasePrice)} />
        </div>
        <div className="flex items-center justify-between gap-2 text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            {formatDate(new Date(account.purchaseDate), timezone)}
          </span>
          <span>
            {account.activeListingCount} active listing{account.activeListingCount === 1 ? "" : "s"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 border-t pt-2">
          <span className="font-mono text-[10px] text-muted-foreground" title={account.id}>
            {truncateMiddle(account.id)}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onView}>
              <Eye />
              View
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <MoreHorizontal />
                  <span className="sr-only">Account actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={onView}>
                  <Eye />
                  View details
                </DropdownMenuItem>
                {!sold ? (
                  <DropdownMenuItem asChild>
                    <Link href={`/listings?create=1&account=${account.id}`}>
                      <Store />
                      Create listing
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem disabled={sold} onSelect={onEdit}>
                  <Pencil />
                  Edit account
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={sold || account.activeListingCount > 0}
                  onSelect={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 />
                  Delete account
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </Card>
  );
}
