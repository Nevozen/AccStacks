"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Store } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { SaleConfirmationDialog } from "@/features/sales/sale-confirmation-dialog";
import { cancelListingAction } from "./actions";
import { ListingCard } from "./listing-card";
import { ListingFormDialog } from "./listing-form-dialog";
import type { EligibleAccountDto, ListingDto } from "./types";

type Query = { q: string; game: string; marketplace: string; sort: string };

export function ListingsWorkspace({
  listings,
  totalActiveListings,
  uniqueListedAccounts,
  totalFiltered,
  page,
  totalPages,
  query,
  games,
  marketplaces,
  marketplaceSuggestions,
  eligibleAccounts,
  initialAccount,
  initialCreateOpen,
  timezone,
}: {
  listings: ListingDto[];
  totalActiveListings: number;
  uniqueListedAccounts: number;
  totalFiltered: number;
  page: number;
  totalPages: number;
  query: Query;
  games: string[];
  marketplaces: string[];
  marketplaceSuggestions: string[];
  eligibleAccounts: EligibleAccountDto[];
  initialAccount: EligibleAccountDto | null;
  initialCreateOpen: boolean;
  timezone: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [navigating, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(initialCreateOpen);
  const [editing, setEditing] = useState<ListingDto | null>(null);
  const [deleting, setDeleting] = useState<ListingDto | null>(null);
  const [selling, setSelling] = useState<ListingDto | null>(null);
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

  function handleFormOpen(open: boolean) {
    setFormOpen(open);
    if (!open && initialCreateOpen) updateParams({ create: null, account: null }, false);
  }

  async function confirmDelete() {
    if (!deleting || deletePending) return;
    setDeletePending(true);
    const result = await cancelListingAction(deleting.id);
    setDeletePending(false);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    setDeleting(null);
    router.refresh();
  }

  const hasFilters = Boolean(query.q || query.game || query.marketplace);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Listings"
        description={`${totalActiveListings} active listing${totalActiveListings === 1 ? "" : "s"} across ${uniqueListedAccounts} account${uniqueListedAccounts === 1 ? "" : "s"}.`}
        actions={
          <Button onClick={openCreate}>
            <Plus />
            Create New Listing
          </Button>
        }
      />
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
            placeholder="Search account, game, ID, or marketplace"
            aria-label="Search listings"
          />
        </form>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Select
            value={query.game || "all"}
            onValueChange={(game) => updateParams({ game: game === "all" ? null : game })}
          >
            <SelectTrigger className="sm:w-36">
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
            value={query.marketplace || "all"}
            onValueChange={(marketplace) =>
              updateParams({ marketplace: marketplace === "all" ? null : marketplace })
            }
          >
            <SelectTrigger className="sm:w-36">
              <SelectValue placeholder="All marketplaces" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All marketplaces</SelectItem>
              {marketplaces.map((marketplace) => (
                <SelectItem key={marketplace} value={marketplace}>
                  {marketplace}
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
              <SelectItem value="newest">Newest listing</SelectItem>
              <SelectItem value="oldest">Longest listed</SelectItem>
              <SelectItem value="priceHigh">Price: high to low</SelectItem>
              <SelectItem value="priceLow">Price: low to high</SelectItem>
              <SelectItem value="profitHigh">Profit: high to low</SelectItem>
              <SelectItem value="profitLow">Profit: low to high</SelectItem>
              <SelectItem value="marketplace">Marketplace</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          icon={Store}
          title={hasFilters ? "No matching listings" : "No active listings"}
          description={
            hasFilters
              ? "Adjust or clear the current search and filters."
              : "Create a marketplace listing from an unsold Stock account."
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
                Create New Listing
              </Button>
            )
          }
        />
      ) : (
        <div
          className={cn("grid gap-3 md:grid-cols-2 2xl:grid-cols-3", navigating && "opacity-70")}
        >
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              timezone={timezone}
              onEdit={() => {
                setEditing(listing);
                setFormOpen(true);
              }}
              onDelete={() => setDeleting(listing)}
              onMarkSold={() => setSelling(listing)}
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

      <ListingFormDialog
        listing={editing}
        initialAccount={initialAccount}
        initialAccounts={eligibleAccounts}
        marketplaces={marketplaceSuggestions}
        open={formOpen}
        onOpenChange={handleFormOpen}
      />
      <SaleConfirmationDialog listing={selling} onClose={() => setSelling(null)} />
      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && !deletePending && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              The listing will be cancelled inside AccStacks, while the account and its history
              remain intact. This does not remove the advertisement from {deleting?.marketplace};
              remove it manually on the external marketplace.
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
              {deletePending ? "Deleting…" : "Delete listing"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
