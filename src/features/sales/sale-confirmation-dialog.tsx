"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { AccountThumbnail } from "@/components/shared/account-thumbnail";
import { Money } from "@/components/shared/money";
import { MoneyInput } from "@/components/shared/money-input";
import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { todayInput } from "@/lib/dates";
import { calculateSaleMetrics } from "@/lib/finance";
import { formatPercentage, moneyToDecimal, parseMoneyInput, type Currency } from "@/lib/money";
import { saleInputSchema, type SaleInput } from "@/schemas/sale";
import type { ListingDto } from "@/features/listings/types";
import { confirmSaleAction } from "./actions";

export function SaleConfirmationDialog({
  listing,
  currency,
  onClose,
}: {
  listing: ListingDto | null;
  currency: Currency;
  onClose: () => void;
}) {
  const router = useRouter();
  const [lossConfirmed, setLossConfirmed] = useState(false);
  const form = useForm<SaleInput>({
    resolver: zodResolver(saleInputSchema(currency)),
    defaultValues: {
      listingId: "",
      sellingPrice: "",
      soldAt: todayInput(),
      notes: "",
      expenses: [],
    },
  });
  const expenseFields = useFieldArray({ control: form.control, name: "expenses" });

  useEffect(() => {
    if (!listing) return;
    form.reset({
      listingId: listing.id,
      sellingPrice: moneyToDecimal(BigInt(listing.listingPrice), currency),
      soldAt: todayInput(),
      notes: "",
      expenses: [],
    });
  }, [currency, form, listing]);

  const sellingPrice = useWatch({ control: form.control, name: "sellingPrice" });
  const expenses = useWatch({ control: form.control, name: "expenses" });
  const actualPrice = parseMoneyInput(sellingPrice, currency) ?? 0n;
  const expenseAmounts = expenses.map(({ amount }) => parseMoneyInput(amount, currency) ?? 0n);
  let metrics: ReturnType<typeof calculateSaleMetrics> | null = null;
  if (listing) {
    try {
      metrics = calculateSaleMetrics({
        sellingPrice: actualPrice,
        purchasePrice: BigInt(listing.account.purchasePrice),
        expenses: expenseAmounts,
      });
    } catch (error) {
      if (!(error instanceof RangeError)) throw error;
    }
  }
  const pending = form.formState.isSubmitting;

  function changeOpen(open: boolean) {
    if (!open) {
      setLossConfirmed(false);
      onClose();
    }
  }

  async function onSubmit(values: SaleInput) {
    if (!metrics) return;
    if (metrics && metrics.netProfit < 0n && !lossConfirmed) {
      toast.error("Confirm that you understand this sale results in a loss");
      return;
    }
    const result = await confirmSaleAction(values);
    if (!result.success) {
      for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (messages?.[0]) form.setError(field as keyof SaleInput, { message: messages[0] });
      }
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    changeOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={Boolean(listing)} onOpenChange={(open) => !pending && !open && changeOpen(false)}>
      <DialogContent className="max-w-2xl">
        {listing ? (
          <>
            <DialogHeader>
              <DialogTitle>Confirm account sale</DialogTitle>
              <DialogDescription>
                Record the final transaction. This closes every active listing for the account
                inside AccStacks.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-start gap-3">
                <AccountThumbnail src={listing.account.imageUrl} alt="" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{listing.account.accountName}</p>
                  <p className="text-xs text-muted-foreground">
                    {listing.account.gameName} · {listing.marketplace}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-2 text-xs">
                <span className="text-muted-foreground">
                  Purchase price{" "}
                  <Money
                    currency={currency}
                    className="ml-1 text-foreground"
                    value={BigInt(listing.account.purchasePrice)}
                  />
                </span>
                <span className="text-right text-muted-foreground">
                  Original listing{" "}
                  <Money
                    currency={currency}
                    className="ml-1 text-foreground"
                    value={BigInt(listing.listingPrice)}
                  />
                </span>
              </div>
            </div>
            <form id="sale-form" className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="sale-selling-price">
                    Actual selling price <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    control={form.control}
                    name="sellingPrice"
                    render={({ field }) => (
                      <MoneyInput
                        currency={currency}
                        id="sale-selling-price"
                        value={field.value}
                        onChange={field.onChange}
                        disabled={pending}
                      />
                    )}
                  />
                  {form.formState.errors.sellingPrice ? (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.sellingPrice.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sale-date">
                    Sale date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="sale-date"
                    type="date"
                    {...form.register("soldAt")}
                    disabled={pending}
                  />
                  {form.formState.errors.soldAt ? (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.soldAt.message}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">Additional expenses</p>
                    <p className="text-xs text-muted-foreground">
                      Marketplace, middleman, transfer, or other fees.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pending || expenseFields.fields.length >= 50}
                    onClick={() => expenseFields.append({ name: "", amount: "0" })}
                  >
                    <Plus />
                    Add expense
                  </Button>
                </div>
                {expenseFields.fields.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No additional expenses.</p>
                ) : null}
                {expenseFields.fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-start gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_auto]"
                  >
                    <div>
                      <Input
                        {...form.register(`expenses.${index}.name`)}
                        placeholder="Expense description"
                        aria-label={`Expense ${index + 1} description`}
                        disabled={pending}
                      />
                      {form.formState.errors.expenses?.[index]?.name ? (
                        <p className="mt-1 text-xs text-destructive">
                          {form.formState.errors.expenses[index]?.name?.message}
                        </p>
                      ) : null}
                    </div>
                    <Controller
                      control={form.control}
                      name={`expenses.${index}.amount`}
                      render={({ field: amountField }) => (
                        <MoneyInput
                          currency={currency}
                          value={amountField.value}
                          onChange={amountField.onChange}
                          aria-label={`Expense ${index + 1} amount`}
                          disabled={pending}
                        />
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => expenseFields.remove(index)}
                      disabled={pending}
                    >
                      <Trash2 />
                      <span className="sr-only">Remove expense {index + 1}</span>
                    </Button>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sale-notes">Transaction notes</Label>
                <Textarea
                  id="sale-notes"
                  {...form.register("notes")}
                  placeholder="Payment or handover details"
                  disabled={pending}
                />
              </div>
              {metrics ? (
                <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-xs">
                  <SummaryRow label="Actual selling price">
                    <Money currency={currency} value={actualPrice} />
                  </SummaryRow>
                  <SummaryRow label="Original purchase price">
                    <Money currency={currency} value={BigInt(listing.account.purchasePrice)} />
                  </SummaryRow>
                  <SummaryRow label="Total additional expenses">
                    <Money currency={currency} value={metrics.totalExpenses} />
                  </SummaryRow>
                  <Separator />
                  <SummaryRow label="Net profit">
                    <Money currency={currency} value={metrics.netProfit} colored />
                  </SummaryRow>
                  <SummaryRow
                    label="Profit margin"
                    value={formatPercentage(metrics.profitMargin)}
                  />
                  <SummaryRow label="Return on investment" value={formatPercentage(metrics.roi)} />
                </div>
              ) : (
                <p role="alert" className="text-xs text-destructive">
                  The combined transaction amounts exceed the supported range.
                </p>
              )}
              {metrics && metrics.netProfit < 0n ? (
                <label className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                  <input
                    type="checkbox"
                    checked={lossConfirmed}
                    onChange={(event) => setLossConfirmed(event.target.checked)}
                    className="order-first mt-0.5 size-4 shrink-0 accent-destructive"
                  />
                  <span>
                    This transaction results in a loss of{" "}
                    <Money currency={currency} value={-metrics.netProfit} />. Confirm that you want
                    to record it anyway.
                  </span>
                </label>
              ) : null}
            </form>
            <p className="text-xs text-muted-foreground">
              Closing listings here does not remove external advertisements. Remove remaining
              marketplace posts manually after the sale.
            </p>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => changeOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" form="sale-form" disabled={pending}>
                {pending ? <Loader2 className="animate-spin" /> : null}
                Confirm sale
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function SummaryRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{children ?? value}</span>
    </div>
  );
}
