"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, Grid2X2, List, PackageOpen, Plus, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { CollectionPagination, CollectionSearch } from "@/components/shared/collection-controls";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { archiveAccountAction, setStockViewAction } from "./actions";
import { AccountCard } from "./account-card";
import { AccountDetailSheet } from "./account-detail-sheet";
import { AccountFormDialog } from "./account-form-dialog";
import { AccountTable } from "./account-table";
import type { AccountDetailDto, StockAccountDto, StockCounts } from "./types";

type Query = { q: string; game: string; category: string; sort: string; view: "grid" | "table" };
const categories = ["all", "available", "listed", "sold"] as const;

export function StocksWorkspace({
  accounts,
  counts,
  totalAccounts,
  totalFiltered,
  page,
  totalPages,
  query,
  games,
  detail,
  timezone,
  initialAddOpen,
}: {
  accounts: StockAccountDto[];
  counts: StockCounts;
  totalAccounts: number;
  totalFiltered: number;
  page: number;
  totalPages: number;
  query: Query;
  games: string[];
  detail: AccountDetailDto | null;
  timezone: string;
  initialAddOpen: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [navigating, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(initialAddOpen);
  const [editing, setEditing] = useState<StockAccountDto | null>(null);
  const [deleting, setDeleting] = useState<StockAccountDto | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  function updateParams(values: Record<string, string | null>, resetPage = true) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(values)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    if (resetPage) params.delete("page");
    startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }));
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(account: StockAccountDto) {
    setEditing(account);
    setFormOpen(true);
  }

  function handleFormOpen(open: boolean) {
    setFormOpen(open);
    if (!open && initialAddOpen) updateParams({ add: null }, false);
  }

  async function confirmDelete() {
    if (!deleting || deletePending) return;
    setDeletePending(true);
    const result = await archiveAccountAction(deleting.id);
    setDeletePending(false);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    setDeleting(null);
    if (detail?.id === deleting.id) updateParams({ account: null }, false);
    router.refresh();
  }

  const hasFilters = Boolean(query.q || query.game);
  const isSold = query.category === "sold";

  function setView(view: "grid" | "table") {
    if (view === query.view) return;
    updateParams({ view }, false);
    void setStockViewAction(view === "grid" ? "GRID" : "TABLE").catch(() =>
      toast.error("Unable to save view preference"),
    );
  }

  return (
    <div className="space-y-grid">
      <PageHeader
        title={isSold ? "Sold Accounts" : "Stocks"}
        description={isSold ? "Completed sales and their original transaction records." : undefined}
        actions={
          <>
            <Button asChild variant="outline">
              <a href={isSold ? "/api/export/sales" : "/api/export/accounts"} download>
                <Download />
                {isSold ? "Export Sales" : "Export CSV"}
              </a>
            </Button>
            <Button onClick={openCreate}>
              <Plus />
              Add Account
            </Button>
          </>
        }
      />
      <div className="rounded-xl border bg-card">
        <div
          role="group"
          aria-label="Account status"
          className="grid grid-cols-2 gap-1 border-b p-2 sm:flex sm:flex-wrap"
        >
          {categories.map((category) => (
            <Button
              key={category}
              variant="ghost"
              size="sm"
              aria-pressed={query.category === category}
              className={cn(
                "justify-between capitalize sm:justify-center",
                query.category === category && "bg-accent text-accent-foreground",
              )}
              onClick={() => updateParams({ category: category === "all" ? null : category })}
            >
              {category === "all"
                ? "All Accounts"
                : category === "sold"
                  ? "Sold Accounts"
                  : category}
              <span className="rounded bg-card px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                {counts[category]}
              </span>
            </Button>
          ))}
        </div>
        <div className="flex flex-col gap-2 p-3 xl:flex-row">
          <CollectionSearch
            value={query.q}
            label="Search stocks"
            placeholder="Find by account, game, or ID"
            onSearch={(q) => updateParams({ q })}
          />
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Select
              value={query.game || "all"}
              onValueChange={(game) => updateParams({ game: game === "all" ? null : game })}
            >
              <SelectTrigger className="sm:w-40" aria-label="Filter stocks by game">
                <SelectValue placeholder="All games" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All games</SelectItem>
                {games.map((game) => (
                  <SelectItem key={game} value={game}>
                    {game}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={query.sort}
              onValueChange={(sort) => updateParams({ sort: sort === "statusName" ? null : sort })}
            >
              <SelectTrigger className="sm:w-44" aria-label="Sort stocks">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="statusName">Status and name</SelectItem>
                <SelectItem value="newest">Newest purchase</SelectItem>
                <SelectItem value="oldest">Oldest purchase</SelectItem>
                <SelectItem value="purchaseHigh">Price: high to low</SelectItem>
                <SelectItem value="purchaseLow">Price: low to high</SelectItem>
                <SelectItem value="name">Account name</SelectItem>
                <SelectItem value="saleNewest">Latest sale</SelectItem>
                <SelectItem value="profitHigh">Profit: high to low</SelectItem>
                <SelectItem value="profitLow">Profit: low to high</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div
            role="group"
            aria-label="Stock view"
            className="flex w-fit gap-0.5 rounded-md bg-muted p-0.5"
          >
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                query.view === "grid" && "bg-card text-accent-foreground shadow-surface",
              )}
              aria-pressed={query.view === "grid"}
              onClick={() => setView("grid")}
            >
              <Grid2X2 />
              <span className="sr-only">Grid view</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                query.view === "table" && "bg-card text-accent-foreground shadow-surface",
              )}
              aria-pressed={query.view === "table"}
              onClick={() => setView("table")}
            >
              <List />
              <span className="sr-only">Table view</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-grid" aria-busy={navigating}>
        {accounts.length === 0 ? (
          <EmptyState
            icon={isSold ? ReceiptText : PackageOpen}
            title={
              hasFilters
                ? "No matching accounts"
                : isSold
                  ? "No sold accounts"
                  : totalAccounts === 0
                    ? "Add your first account"
                    : "No accounts in this category"
            }
            description={
              hasFilters
                ? "Adjust or clear the current search and filters."
                : isSold
                  ? "Accounts appear here once you record a completed sale."
                  : "Track purchase cost and marketplace listings for each account."
            }
            action={
              hasFilters ? (
                <Button variant="outline" onClick={() => updateParams({ q: null, game: null })}>
                  Clear filters
                </Button>
              ) : isSold ? (
                <Button asChild variant="outline">
                  <Link href="/listings">Go to Listings</Link>
                </Button>
              ) : (
                <Button onClick={openCreate}>
                  <Plus />
                  Add Account
                </Button>
              )
            }
          />
        ) : query.view === "table" ? (
          <AccountTable
            accounts={accounts}
            timezone={timezone}
            showSales={isSold}
            onView={(account) => updateParams({ account: account.id }, false)}
            onEdit={openEdit}
            onDelete={setDeleting}
          />
        ) : (
          <div
            className={cn(
              "grid gap-grid sm:grid-cols-2 xl:grid-cols-3",
              navigating && "opacity-70",
            )}
          >
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                timezone={timezone}
                onView={() => updateParams({ account: account.id }, false)}
                onEdit={() => openEdit(account)}
                onDelete={() => setDeleting(account)}
              />
            ))}
          </div>
        )}

        <CollectionPagination
          page={page}
          totalPages={totalPages}
          count={totalFiltered}
          pending={navigating}
          onPageChange={(next) => updateParams({ page: String(next) }, false)}
        />
      </div>

      <AccountFormDialog
        key={editing?.id ?? "new-account"}
        account={editing}
        games={games}
        open={formOpen}
        onOpenChange={handleFormOpen}
      />
      <AccountDetailSheet
        account={detail}
        timezone={timezone}
        onClose={() => updateParams({ account: null }, false)}
        onEdit={openEdit}
      />
      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && !deletePending && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this account?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.accountName} will be archived and removed from inventory. Historical
              inactive listings remain preserved. This cannot be done while active listings exist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className={cn(buttonVariants({ variant: "outline" }))}
              disabled={deletePending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className={cn(buttonVariants({ variant: "destructive" }))}
              disabled={deletePending}
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
            >
              {deletePending ? "Deleting…" : "Delete account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
