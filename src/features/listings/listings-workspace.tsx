"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, Plus, Store } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { CollectionPagination, CollectionSearch } from "@/components/shared/collection-controls";
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
import type { Currency } from "@/lib/money";
import { SaleConfirmationDialog } from "@/features/sales/sale-confirmation-dialog";
import { cancelListingAction } from "./actions";
import { groupListings } from "./groups";
import { ListingCard } from "./listing-card";
import { ListingGroupCard } from "./listing-group-card";
import { ListingGroupExpansion } from "./listing-group-expansion";
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
  currency,
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
  currency: Currency;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [navigating, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(initialCreateOpen);
  const [editing, setEditing] = useState<ListingDto | null>(null);
  const [deleting, setDeleting] = useState<ListingDto | null>(null);
  const [selling, setSelling] = useState<ListingDto | null>(null);
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const groups = groupListings(listings);
  const orderedGroups = expandedAccountId
    ? [
        ...groups.filter((group) => group.account.id === expandedAccountId),
        ...groups.filter((group) => group.account.id !== expandedAccountId),
      ]
    : groups;

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
    <div className="space-y-grid">
      <PageHeader
        title="Listings"
        description={`${totalActiveListings} active ${totalActiveListings === 1 ? "listing" : "listings"} across ${uniqueListedAccounts} ${uniqueListedAccounts === 1 ? "account" : "accounts"}`}
        actions={
          <>
            <Button asChild variant="outline">
              <a href="/api/export/listings" download>
                <Download />
                Export CSV
              </a>
            </Button>
            <Button onClick={openCreate}>
              <Plus />
              Create New Listing
            </Button>
          </>
        }
      />
      <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 xl:flex-row">
        <CollectionSearch
          value={query.q}
          label="Search listings"
          placeholder="Find by account, marketplace, or ID"
          onSearch={(q) => updateParams({ q })}
        />
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Select
            value={query.game || "all"}
            onValueChange={(game) => updateParams({ game: game === "all" ? null : game })}
          >
            <SelectTrigger className="sm:w-36" aria-label="Filter listings by game">
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
            <SelectTrigger className="sm:w-44" aria-label="Filter listings by marketplace">
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
            <SelectTrigger className="col-span-2 sm:w-44" aria-label="Sort listings">
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

      <div className="space-y-grid" aria-busy={navigating}>
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
                  onClick={() => updateParams({ q: null, game: null, marketplace: null })}
                >
                  Clear filters
                </Button>
              ) : eligibleAccounts.length === 0 ? (
                <Button asChild variant="outline">
                  <Link href="/stocks?add=1">
                    <Plus /> Add Account
                  </Link>
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
            className={cn(
              "grid items-start gap-grid md:grid-cols-2 2xl:grid-cols-3",
              navigating && "opacity-70",
            )}
            data-testid="listings-grid"
          >
            {orderedGroups.map((group) =>
              expandedAccountId === group.account.id ? (
                <ListingGroupExpansion
                  key={group.account.id}
                  group={group}
                  timezone={timezone}
                  currency={currency}
                  onClose={() => setExpandedAccountId(null)}
                  onEdit={(listing) => {
                    setExpandedAccountId(null);
                    setEditing(listing);
                    setFormOpen(true);
                  }}
                  onDelete={(listing) => {
                    setExpandedAccountId(null);
                    setDeleting(listing);
                  }}
                  onMarkSold={(listing) => {
                    setExpandedAccountId(null);
                    setSelling(listing);
                  }}
                />
              ) : group.listings.length === 1 ? (
                <ListingCard
                  key={group.account.id}
                  listing={group.listings[0]!}
                  timezone={timezone}
                  currency={currency}
                  onEdit={() => {
                    setEditing(group.listings[0]!);
                    setFormOpen(true);
                  }}
                  onDelete={() => setDeleting(group.listings[0]!)}
                  onMarkSold={() => setSelling(group.listings[0]!)}
                />
              ) : (
                <ListingGroupCard
                  key={group.account.id}
                  group={group}
                  currency={currency}
                  onShowAll={() => setExpandedAccountId(group.account.id)}
                />
              ),
            )}
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

      <ListingFormDialog
        listing={editing}
        initialAccount={initialAccount}
        initialAccounts={eligibleAccounts}
        marketplaces={marketplaceSuggestions}
        currency={currency}
        open={formOpen}
        onOpenChange={handleFormOpen}
      />
      <SaleConfirmationDialog
        listing={selling}
        currency={currency}
        onClose={() => setSelling(null)}
      />
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
