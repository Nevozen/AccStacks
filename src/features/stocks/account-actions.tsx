"use client";

import Link from "next/link";
import { Eye, MoreHorizontal, Pencil, Store, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { StockAccountDto } from "./types";

export function AccountActions({
  account,
  onView,
  onEdit,
  onDelete,
}: {
  account: StockAccountDto;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center justify-end gap-0.5">
      <Button variant="ghost" size="sm" onClick={onView}>
        <Eye aria-hidden="true" /> View
      </Button>
      {account.status !== "SOLD" ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Account actions">
              <MoreHorizontal aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/listings?create=1&account=${account.id}`}>
                <Store aria-hidden="true" /> Create listing
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil aria-hidden="true" /> Edit account
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={account.activeListingCount > 0}
              onSelect={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 aria-hidden="true" /> Delete account
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}
