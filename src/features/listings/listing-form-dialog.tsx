"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AccountThumbnail } from "@/components/shared/account-thumbnail";
import { Money } from "@/components/shared/money";
import { MoneyInput } from "@/components/shared/money-input";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { todayInput } from "@/lib/dates";
import { calculateListingMetrics } from "@/lib/finance";
import { formatPercentage } from "@/lib/money";
import { normalizeCategory } from "@/lib/normalization";
import { cn } from "@/lib/utils";
import { listingInputSchema, type ListingInput } from "@/schemas/listing";
import { createListingAction, updateListingAction } from "./actions";
import type { EligibleAccountDto, ListingDto } from "./types";

export function ListingFormDialog({
  listing,
  initialAccount,
  initialAccounts,
  marketplaces,
  open,
  onOpenChange,
}: {
  listing?: ListingDto | null;
  initialAccount?: EligibleAccountDto | null;
  initialAccounts: EligibleAccountDto[];
  marketplaces: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [accounts, setAccounts] = useState(initialAccounts);
  const [accountSearch, setAccountSearch] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [duplicateConfirmed, setDuplicateConfirmed] = useState(false);
  const form = useForm<ListingInput>({
    resolver: zodResolver(listingInputSchema),
    defaultValues: {
      accountId: "",
      marketplace: "",
      listingPrice: "",
      listingUrl: "",
      listedAt: todayInput(),
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      listing
        ? {
            accountId: listing.account.id,
            marketplace: listing.marketplace,
            listingPrice: listing.listingPrice,
            listingUrl: listing.listingUrl ?? "",
            listedAt: listing.listedDateInput,
            notes: listing.notes ?? "",
          }
        : {
            accountId: initialAccount?.id ?? "",
            marketplace: "",
            listingPrice: "",
            listingUrl: "",
            listedAt: todayInput(),
            notes: "",
          },
    );
  }, [form, initialAccount, listing, open]);

  useEffect(() => {
    if (!open || listing) return;
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setAccountsLoading(true);
      try {
        const response = await fetch(
          `/api/accounts/eligible?q=${encodeURIComponent(accountSearch)}`,
          {
            signal: controller.signal,
          },
        );
        if (!response.ok) return;
        const data = (await response.json()) as { accounts: EligibleAccountDto[] };
        setAccounts(data.accounts);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        toast.error("Unable to search eligible accounts");
      } finally {
        if (!controller.signal.aborted) setAccountsLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [accountSearch, listing, open]);

  const accountId = useWatch({ control: form.control, name: "accountId" });
  const listingPrice = useWatch({ control: form.control, name: "listingPrice" });
  const marketplace = useWatch({ control: form.control, name: "marketplace" });
  const fallbackAccount = listing?.account ?? initialAccount;
  const selectedAccount =
    accounts.find((account) => account.id === accountId) ??
    (fallbackAccount?.id === accountId ? fallbackAccount : null);
  const metrics =
    selectedAccount && /^\d+$/.test(listingPrice)
      ? calculateListingMetrics({
          listingPrice: BigInt(listingPrice),
          purchasePrice: BigInt(selectedAccount.purchasePrice),
        })
      : null;
  const duplicate =
    !listing &&
    Boolean(
      selectedAccount?.activeListings.some(
        (item) => item.marketplaceNormalized === normalizeCategory(marketplace || ""),
      ),
    );
  const errors = form.formState.errors;
  const pending = form.formState.isSubmitting;

  async function onSubmit(values: ListingInput) {
    if (duplicate && !duplicateConfirmed) {
      toast.error("Confirm that the duplicate marketplace listing is intentional");
      return;
    }
    const result = listing
      ? await updateListingAction(listing.id, {
          marketplace: values.marketplace,
          listingPrice: values.listingPrice,
          listingUrl: values.listingUrl,
          listedAt: values.listedAt,
          notes: values.notes,
        })
      : await createListingAction(values);
    if (!result.success) {
      for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (messages?.[0]) form.setError(field as keyof ListingInput, { message: messages[0] });
      }
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    changeOpen(false);
    router.refresh();
  }

  function changeOpen(value: boolean) {
    if (!value) setDuplicateConfirmed(false);
    onOpenChange(value);
  }

  return (
    <Dialog open={open} onOpenChange={(value) => !pending && changeOpen(value)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{listing ? "Edit listing" : "Create new listing"}</DialogTitle>
          <DialogDescription>
            Track an external marketplace advertisement without duplicating the underlying account.
          </DialogDescription>
        </DialogHeader>
        <form
          id="listing-form"
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          {!listing ? (
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="listing-account">
                Select account <span className="text-destructive">*</span>
              </Label>
              <Popover open={accountOpen} onOpenChange={setAccountOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="listing-account"
                    type="button"
                    variant="outline"
                    className="h-auto min-h-9 w-full justify-between py-2"
                    disabled={pending}
                  >
                    <span className={cn("truncate", !selectedAccount && "text-muted-foreground")}>
                      {selectedAccount
                        ? `${selectedAccount.accountCode} — ${selectedAccount.accountName} — ${selectedAccount.gameName}`
                        : "Search available and listed accounts"}
                    </span>
                    <ChevronsUpDown className="size-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-0"
                  align="start"
                >
                  <Command shouldFilter={false}>
                    <CommandInput
                      value={accountSearch}
                      onValueChange={setAccountSearch}
                      placeholder="Search name, game, or ID"
                    />
                    <CommandList>
                      <CommandEmpty>
                        {accountsLoading ? "Searching…" : "No eligible accounts found."}
                      </CommandEmpty>
                      <CommandGroup>
                        {accounts.map((account) => (
                          <CommandItem
                            key={account.id}
                            value={account.id}
                            onSelect={() => {
                              form.setValue("accountId", account.id, { shouldValidate: true });
                              setDuplicateConfirmed(false);
                              setAccountOpen(false);
                            }}
                          >
                            <AccountThumbnail src={account.imageUrl} alt="" className="size-8" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate">{account.accountName}</span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {account.gameName} · <Money value={BigInt(account.purchasePrice)} />
                              </span>
                            </span>
                            {account.id === accountId ? <Check className="size-4" /> : null}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.accountId ? (
                <p className="text-xs text-destructive">{errors.accountId.message}</p>
              ) : null}
            </div>
          ) : null}

          {selectedAccount ? (
            <div className="rounded-lg border bg-muted/30 p-3 sm:col-span-2">
              <div className="flex items-start gap-3">
                <AccountThumbnail src={selectedAccount.imageUrl} alt="" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{selectedAccount.accountName}</p>
                  <p className="text-xs text-muted-foreground">{selectedAccount.gameName}</p>
                  <p className="mt-1 text-xs">
                    Purchase price: <Money value={BigInt(selectedAccount.purchasePrice)} />
                  </p>
                </div>
              </div>
              {selectedAccount.activeListings.length ? (
                <div className="mt-3 border-t pt-2">
                  <p className="mb-1 text-xs text-muted-foreground">Current active listings</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAccount.activeListings.map((item) => (
                      <span key={item.id} className="rounded bg-secondary px-2 py-1 text-[10px]">
                        {item.marketplace}: <Money value={BigInt(item.listingPrice)} />
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <Field label="Marketplace name" error={errors.marketplace?.message} required>
            <Input
              {...form.register("marketplace", { onChange: () => setDuplicateConfirmed(false) })}
              list="marketplace-suggestions"
              placeholder="Instagram"
              disabled={pending}
            />
            <datalist id="marketplace-suggestions">
              {marketplaces.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </Field>
          <Field label="Listing price" error={errors.listingPrice?.message} required>
            <Controller
              control={form.control}
              name="listingPrice"
              render={({ field }) => (
                <MoneyInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="850.000"
                  disabled={pending}
                />
              )}
            />
          </Field>
          <Field label="Listing date" error={errors.listedAt?.message} required>
            <Input type="date" {...form.register("listedAt")} disabled={pending} />
          </Field>
          <Field label="External listing URL" error={errors.listingUrl?.message}>
            <Input
              type="url"
              {...form.register("listingUrl")}
              placeholder="https://marketplace.example/listing/123"
              disabled={pending}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Additional notes" error={errors.notes?.message}>
              <Textarea
                {...form.register("notes")}
                placeholder="Listing-specific details"
                disabled={pending}
              />
            </Field>
          </div>

          {duplicate ? (
            <label className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs sm:col-span-2">
              <input
                type="checkbox"
                checked={duplicateConfirmed}
                onChange={(event) => setDuplicateConfirmed(event.target.checked)}
                className="mt-0.5"
              />
              <span>
                An active {marketplace} listing already exists for this account. Confirm only if
                this duplicate is intentional.
              </span>
            </label>
          ) : null}

          {metrics ? (
            <div className="grid grid-cols-3 gap-2 rounded-lg border p-3 text-center sm:col-span-2">
              <Metric
                label="Estimated profit"
                value={<Money value={metrics.estimatedProfit} colored />}
              />
              <Metric
                label="Profit margin"
                value={formatPercentage(metrics.estimatedProfitMargin)}
              />
              <Metric label="Estimated ROI" value={formatPercentage(metrics.estimatedRoi)} />
            </div>
          ) : null}
        </form>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => changeOpen(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="submit" form="listing-form" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            {listing ? "Save changes" : "Create listing"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Label className="block space-y-1.5">
      <span className="block">
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </span>
      {children}
      {error ? (
        <span className="block text-xs text-destructive" role="alert">
          {error}
        </span>
      ) : null}
    </Label>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
