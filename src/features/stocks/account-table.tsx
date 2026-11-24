"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";
import { Money } from "@/components/shared/money";
import { AccountStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/dates";
import { cn, truncateMiddle } from "@/lib/utils";
import type { StockAccountDto } from "./types";

export function AccountTable({
  accounts,
  timezone,
  onView,
  onEdit,
  onDelete,
}: {
  accounts: StockAccountDto[];
  timezone: string;
  onView: (account: StockAccountDto) => void;
  onEdit: (account: StockAccountDto) => void;
  onDelete: (account: StockAccountDto) => void;
}) {
  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Account ID</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Game</TableHead>
            <TableHead className="text-right">Purchase price</TableHead>
            <TableHead>Purchase date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Listings</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => {
            const sold = account.status === "SOLD";
            return (
              <TableRow
                key={account.id}
                className={cn(sold && "bg-muted/40 text-muted-foreground")}
              >
                <TableCell className="font-mono text-xs" title={account.id}>
                  {truncateMiddle(account.id)}
                </TableCell>
                <TableCell className="max-w-48 truncate font-medium">
                  {account.accountName}
                </TableCell>
                <TableCell>{account.gameName}</TableCell>
                <TableCell className="text-right">
                  <Money value={BigInt(account.purchasePrice)} />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDate(new Date(account.purchaseDate), timezone)}
                </TableCell>
                <TableCell>
                  <AccountStatusBadge status={account.status} />
                </TableCell>
                <TableCell>{account.activeListingCount}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => onView(account)}>
                      <Eye />
                      <span className="sr-only">View {account.accountName}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={sold}
                      onClick={() => onEdit(account)}
                    >
                      <Pencil />
                      <span className="sr-only">Edit {account.accountName}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={sold || account.activeListingCount > 0}
                      onClick={() => onDelete(account)}
                    >
                      <Trash2 />
                      <span className="sr-only">Delete {account.accountName}</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
