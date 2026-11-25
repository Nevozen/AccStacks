"use client";

import { AccountThumbnail } from "@/components/shared/account-thumbnail";
import { Money } from "@/components/shared/money";
import { AccountStatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { AccountActions } from "./account-actions";
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
  const sale = account.sale;
  return (
    <Card className={cn("flex flex-col p-panel", sale && "bg-muted/45")} data-testid="account-card">
      <div className="flex items-center gap-3">
        <AccountThumbnail src={account.imageUrl} alt="" className={cn(sale && "grayscale")} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold" title={account.accountName}>
            {account.accountName}
          </h2>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{account.gameName}</p>
        </div>
        <AccountStatusBadge status={account.status} />
      </div>
      {account.description ? (
        <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">{account.description}</p>
      ) : null}
      <dl className="mt-auto grid grid-cols-2 gap-2 pt-3 text-xs">
        <div>
          <dt className="text-muted-foreground">Purchase price</dt>
          <dd className="mt-0.5 wrap-anywhere">
            <Money
              value={BigInt(sale?.purchasePrice ?? account.purchasePrice)}
              className="font-semibold"
            />
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{sale ? "Net profit" : "Active listings"}</dt>
          <dd className="mt-0.5 font-semibold tabular-nums wrap-anywhere">
            {sale ? (
              <Money value={BigInt(sale.netProfit)} colored className="font-semibold" />
            ) : (
              account.activeListingCount
            )}
          </dd>
        </div>
      </dl>
      <div className="mt-3 flex items-center justify-between gap-2 border-t pt-2">
        <div className="min-w-0 text-xs text-muted-foreground">
          <p className="font-mono text-[11px] wrap-anywhere">{account.accountCode}</p>
          <p>
            {sale ? "Sold" : "Bought"}{" "}
            {formatDate(new Date(sale?.soldAt ?? account.purchaseDate), timezone)}
          </p>
        </div>
        <AccountActions account={account} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </Card>
  );
}
