"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { MoneyInput } from "@/components/shared/money-input";
import { todayInput } from "@/lib/dates";
import { accountInputSchema, type AccountInput } from "@/schemas/account";
import { createAccountAction, updateAccountAction } from "./actions";
import type { StockAccountDto } from "./types";

const emptyValues: AccountInput = {
  gameName: "",
  accountName: "",
  description: "",
  imageUrl: "",
  purchasePrice: "",
  purchaseDate: todayInput(),
  purchasedFrom: "",
  notes: "",
};

export function AccountFormDialog({
  account,
  games,
  open,
  onOpenChange,
}: {
  account?: StockAccountDto | null;
  games: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const form = useForm<AccountInput>({
    resolver: zodResolver(accountInputSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      account
        ? {
            gameName: account.gameName,
            accountName: account.accountName,
            description: account.description ?? "",
            imageUrl: account.imageUrl ?? "",
            purchasePrice: account.purchasePrice,
            purchaseDate: account.purchaseDateInput,
            purchasedFrom: account.purchasedFrom ?? "",
            notes: account.notes ?? "",
          }
        : { ...emptyValues, purchaseDate: todayInput() },
    );
  }, [account, form, open]);

  async function onSubmit(values: AccountInput) {
    const result = account
      ? await updateAccountAction(account.id, values)
      : await createAccountAction(values);
    if (!result.success) {
      for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (messages?.[0]) form.setError(field as keyof AccountInput, { message: messages[0] });
      }
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    onOpenChange(false);
    router.refresh();
  }

  const errors = form.formState.errors;
  const pending = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={(value) => !pending && onOpenChange(value)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{account ? "Edit account" : "Add account"}</DialogTitle>
          <DialogDescription>
            Record business information only. Never store game passwords, recovery codes, or session
            tokens.
          </DialogDescription>
        </DialogHeader>
        <form
          id="account-form"
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <Field label="Game name" error={errors.gameName?.message} required>
            <Input
              {...form.register("gameName")}
              list="account-game-suggestions"
              placeholder="Mobile Legends"
              disabled={pending}
            />
            <datalist id="account-game-suggestions">
              {games.map((game) => (
                <option key={game} value={game} />
              ))}
            </datalist>
          </Field>
          <Field label="Account name" error={errors.accountName?.message} required>
            <Input
              {...form.register("accountName")}
              placeholder="Mythical Glory Account"
              disabled={pending}
            />
          </Field>
          <Field label="Purchase price" error={errors.purchasePrice?.message} required>
            <Controller
              control={form.control}
              name="purchasePrice"
              render={({ field }) => (
                <MoneyInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="500.000"
                  disabled={pending}
                  aria-invalid={Boolean(errors.purchasePrice)}
                />
              )}
            />
          </Field>
          <Field label="Purchase date" error={errors.purchaseDate?.message} required>
            <Input type="date" {...form.register("purchaseDate")} disabled={pending} />
          </Field>
          <Field label="Purchased from" error={errors.purchasedFrom?.message}>
            <Input
              {...form.register("purchasedFrom")}
              placeholder="Seller or source"
              disabled={pending}
            />
          </Field>
          <Field label="Thumbnail URL (HTTPS)" error={errors.imageUrl?.message}>
            <Input
              type="url"
              {...form.register("imageUrl")}
              placeholder="https://example.com/image.jpg"
              disabled={pending}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description" error={errors.description?.message}>
              <Textarea
                {...form.register("description")}
                placeholder="Account rank, collection, or other non-sensitive details"
                disabled={pending}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Internal notes" error={errors.notes?.message}>
              <Textarea
                {...form.register("notes")}
                placeholder="Private business notes"
                disabled={pending}
              />
            </Field>
          </div>
        </form>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="submit" form="account-form" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            {account ? "Save changes" : "Add account"}
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
