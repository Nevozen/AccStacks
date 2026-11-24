"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Grid2X2, List, PackageOpen, Plus, Search } from "lucide-react";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [navigating, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
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

  const hasFilters = Boolean(query.q || query.game || query.category !== "all");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Stocks"
        description={`${totalAccounts} account${totalAccounts === 1 ? "" : "s"} across your inventory.`}
        actions={
          <Button onClick={openCreate}>
            <Plus />
            Add Account
          </Button>
        }
      />
      <div className="space-y-3">
        <div className="flex flex-col gap-2 xl:flex-row">
          <form
            className="relative min-w-0 flex-1"
            onSubmit={(event) => {
              event.preventDefault();
              updateParams({ q: String(new FormData(event.currentTarget).get("q") ?? "").trim() });
            }}
          >
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              key={query.q}
              name="q"
              defaultValue={query.q}
              className="pl-9"
              placeholder="Search account, game, or account ID"
              aria-label="Search accounts"
            />
          </form>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Select
              value={query.game || "all"}
              onValueChange={(game) => updateParams({ game: game === "all" ? null : game })}
            >
              <SelectTrigger className="sm:w-40">
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
              onValueChange={(sort) => updateParams({ sort: sort === "newest" ? null : sort })}
            >
              <SelectTrigger className="sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
          <div className="flex rounded-lg border bg-card p-1">
            <Button
              variant={query.view === "grid" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => {
                updateParams({ view: query.view === "grid" ? null : "grid" });
                void setStockViewAction("GRID").catch(() =>
                  toast.error("Unable to save view preference"),
                );
              }}
            >
              <Grid2X2 />
              <span className="sr-only">Grid view</span>
            </Button>
            <Button
              variant={query.view === "table" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => {
                updateParams({ view: "table" });
                void setStockViewAction("TABLE").catch(() =>
                  toast.error("Unable to save view preference"),
                );
              }}
            >
              <List />
              <span className="sr-only">Table view</span>
            </Button>
          </div>
        </div>
        <Tabs
          value={query.category}
          onValueChange={(category) =>
            updateParams({ category: category === "all" ? null : category })
          }
        >
          <TabsList className="h-auto w-full justify-start overflow-x-auto sm:w-auto">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category === "all"
                  ? "All Accounts"
                  : category === "sold"
                    ? "Sold Accounts"
                    : category}
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] tabular-nums">
                  {counts[category]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title={
            hasFilters
              ? "No matching accounts"
              : totalAccounts === 0
                ? "Add your first account"
                : "No accounts in this category"
          }
          description={
            hasFilters
              ? "Adjust or clear the current search and filters."
              : "Purchased game accounts will appear here with their current status."
          }
          action={
            hasFilters ? (
              <Button
                variant="outline"
                onClick={() => startTransition(() => router.replace(pathname))}
              >
                Clear filters
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
          onView={(account) => updateParams({ account: account.id }, false)}
          onEdit={openEdit}
          onDelete={setDeleting}
        />
      ) : (
        <div
          className={cn("grid gap-3 md:grid-cols-2 2xl:grid-cols-3", navigating && "opacity-70")}
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

      {totalFiltered > 0 ? (
        <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            {totalFiltered} result{totalFiltered === 1 ? "" : "s"} · Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || navigating}
              onClick={() => updateParams({ page: String(page - 1) }, false)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || navigating}
              onClick={() => updateParams({ page: String(page + 1) }, false)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <AccountFormDialog
        account={editing}
        games={games}
        open={formOpen}
        onOpenChange={setFormOpen}
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
