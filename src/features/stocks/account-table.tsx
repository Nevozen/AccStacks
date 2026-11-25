"use client";

import { AccountThumbnail } from "@/components/shared/account-thumbnail";
import { Money } from "@/components/shared/money";
import { AccountStatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/dates";
import type { Currency } from "@/lib/money";
import { AccountActions } from "./account-actions";
import type { StockAccountDto } from "./types";

export function AccountTable({
  accounts,
  timezone,
  currency,
  showSales,
  onView,
  onEdit,
  onDelete,
}: {
  accounts: StockAccountDto[];
  timezone: string;
  currency: Currency;
  showSales: boolean;
  onView: (account: StockAccountDto) => void;
  onEdit: (account: StockAccountDto) => void;
  onDelete: (account: StockAccountDto) => void;
}) {
  return (
    <div className="rounded-xl border bg-card p-1">
      <Table scrollLabel={showSales ? "Sold accounts and transaction details" : "Stock accounts"}>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Account</TableHead>
            <TableHead scope="col">{showSales ? "Marketplace" : "Status"}</TableHead>
            <TableHead scope="col" className="text-right">
              {showSales ? "Purchase cost" : "Purchase price"}
            </TableHead>
            {showSales ? (
              <>
                <TableHead scope="col" className="text-right">
                  Selling price
                </TableHead>
                <TableHead scope="col" className="text-right">
                  Expenses
                </TableHead>
                <TableHead scope="col" className="text-right">
                  Net profit
                </TableHead>
              </>
            ) : (
              <TableHead scope="col" className="text-right">
                Active listings
              </TableHead>
            )}
            <TableHead scope="col">{showSales ? "Sale date" : "Purchase date"}</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => {
            const sale = account.sale;
            return (
              <TableRow key={account.id}>
                <TableCell className="min-w-40">
                  <div className="flex items-center gap-2.5">
                    <AccountThumbnail src={account.imageUrl} alt="" className="size-8" />
                    <div className="max-w-52">
                      <p className="font-semibold wrap-anywhere">{account.accountName}</p>
                      <p className="text-xs wrap-anywhere text-muted-foreground">
                        {account.gameName}{" "}
                        <span className="font-mono text-[11px]">{account.accountCode}</span>
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="max-w-40 wrap-anywhere">
                  {showSales ? sale?.marketplace : <AccountStatusBadge status={account.status} />}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Money
                    currency={currency}
                    value={BigInt(showSales && sale ? sale.purchasePrice : account.purchasePrice)}
                  />
                </TableCell>
                {showSales ? (
                  <>
                    <TableCell className="text-right whitespace-nowrap">
                      {sale && <Money currency={currency} value={BigInt(sale.sellingPrice)} />}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {sale && <Money currency={currency} value={BigInt(sale.totalExpenses)} />}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {sale && <Money currency={currency} value={BigInt(sale.netProfit)} colored />}
                    </TableCell>
                  </>
                ) : (
                  <TableCell className="text-right tabular-nums">
                    {account.activeListingCount}
                  </TableCell>
                )}
                <TableCell className="whitespace-nowrap">
                  {formatDate(
                    new Date(showSales && sale ? sale.soldAt : account.purchaseDate),
                    timezone,
                  )}
                </TableCell>
                <TableCell>
                  <AccountActions
                    account={account}
                    onView={() => onView(account)}
                    onEdit={() => onEdit(account)}
                    onDelete={() => onDelete(account)}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
