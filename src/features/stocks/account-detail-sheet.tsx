"use client";

import { ExternalLink, Pencil } from "lucide-react";
import { AccountThumbnail } from "@/components/shared/account-thumbnail";
import { Money } from "@/components/shared/money";
import { AccountStatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { formatDate, formatDateTime } from "@/lib/dates";
import { formatPercentage } from "@/lib/money";
import type { AccountDetailDto } from "./types";

export function AccountDetailSheet({
  account,
  timezone,
  onClose,
  onEdit,
}: {
  account: AccountDetailDto | null;
  timezone: string;
  onClose: () => void;
  onEdit: (account: AccountDetailDto) => void;
}) {
  return (
    <Sheet open={Boolean(account)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="gap-grid sm:max-w-xl">
        {account ? (
          <>
            <div className="pr-8">
              <SheetTitle>Account details</SheetTitle>
              <SheetDescription>Purchase details, listings, and recorded sales.</SheetDescription>
            </div>
            <div className="flex items-start gap-3">
              <AccountThumbnail src={account.imageUrl} alt="" className="size-16" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{account.gameName}</p>
                <h2 className="mt-1 font-semibold wrap-anywhere">{account.accountName}</h2>
                <p className="mt-1 font-mono text-xs font-medium text-muted-foreground">
                  {account.accountCode}
                </p>
              </div>
              <AccountStatusBadge status={account.status} />
            </div>
            {!account.sale ? (
              <Button variant="outline" size="sm" className="w-fit" onClick={() => onEdit(account)}>
                <Pencil />
                Edit account
              </Button>
            ) : null}
            <Section title="Account information">
              <Row label="Purchase price">
                <Money value={BigInt(account.purchasePrice)} />
              </Row>
              <Row
                label="Purchase date"
                value={formatDate(new Date(account.purchaseDate), timezone)}
              />
              <Row label="Purchased from" value={account.purchasedFrom || "Not recorded"} />
              <Row
                label="Holding period"
                value={`${account.holdingDays} days${account.sale ? " (completed)" : " so far"}`}
              />
              <Row label="Active listings" value={String(account.activeListingCount)} />
              <TextBlock label="Description" value={account.description} />
              <TextBlock label="Internal notes" value={account.notes} />
            </Section>
            {account.sale ? (
              <Section title="Completed sale">
                <Row label="Marketplace" value={account.sale.marketplace} />
                <Row
                  label="Sale date"
                  value={formatDateTime(new Date(account.sale.soldAt), timezone)}
                />
                <Row label="Original listing price">
                  <Money value={BigInt(account.sale.originalListingPrice)} />
                </Row>
                <Row label="Actual selling price">
                  <Money value={BigInt(account.sale.sellingPrice)} />
                </Row>
                <Row label="Purchase price snapshot">
                  <Money value={BigInt(account.sale.purchasePrice)} />
                </Row>
                <Row label="Total expenses">
                  <Money value={BigInt(account.sale.totalExpenses)} />
                </Row>
                <Row label="Net profit">
                  <Money value={BigInt(account.sale.netProfit)} colored />
                </Row>
                <Row label="Profit margin" value={formatPercentage(account.sale.profitMargin)} />
                <Row label="Return on investment" value={formatPercentage(account.sale.roi)} />
                {account.sale.expenses.length ? (
                  <div className="rounded-lg border p-3">
                    <p className="mb-2 text-xs font-medium">Expense breakdown</p>
                    {account.sale.expenses.map((expense) => (
                      <div key={expense.id} className="flex justify-between gap-3 py-1 text-xs">
                        <span className="text-muted-foreground">{expense.name}</span>
                        <Money value={BigInt(expense.amount)} />
                      </div>
                    ))}
                  </div>
                ) : null}
                <TextBlock label="Transaction notes" value={account.sale.notes} />
              </Section>
            ) : null}
            <Section title={`Listing history (${account.listings.length})`}>
              {account.listings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No listings have been created.</p>
              ) : null}
              <div className="space-y-2">
                {account.listings.map((listing) => (
                  <div key={listing.id} className="rounded-lg border p-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {listing.marketplace}{" "}
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {listing.listingCode}
                          </span>
                        </span>
                        {listing.listingUrl ? (
                          <a
                            href={listing.listingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                            aria-label={`Open ${listing.marketplace} listing`}
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        ) : null}
                      </div>
                      <Badge variant={listing.status === "ACTIVE" ? "success" : "secondary"}>
                        {listing.status}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <Money value={BigInt(listing.listingPrice)} />
                      <span className="text-muted-foreground">
                        {formatDate(new Date(listing.listedAt), timezone)}
                      </span>
                    </div>
                    {listing.notes ? (
                      <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                        {listing.notes}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </Section>
            <Separator />
            <p className="text-xs text-muted-foreground">
              Added {formatDateTime(new Date(account.createdAt), timezone)}
            </p>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      <div className="space-y-2.5 rounded-lg border bg-card p-3">{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right font-medium wrap-anywhere">{children ?? value}</span>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="text-xs">
      <p className="mb-1 text-muted-foreground">{label}</p>
      <p className="wrap-anywhere whitespace-pre-wrap">{value || "Not recorded"}</p>
    </div>
  );
}
