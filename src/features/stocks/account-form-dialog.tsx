"use client";

import { useEffect, useState } from "react";
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
import { GameNameInput } from "@/components/shared/game-name-input";
import { LocalImageInput } from "@/components/shared/local-image-input";
import { todayInput } from "@/lib/dates";
import { moneyToDecimal, type Currency } from "@/lib/money";
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
  currency,
  open,
  onOpenChange,
}: {
  account?: StockAccountDto | null;
  games: string[];
  currency: Currency;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const form = useForm<AccountInput>({
    resolver: zodResolver(accountInputSchema(currency)),
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
            purchasePrice: moneyToDecimal(BigInt(account.purchasePrice), currency),
            purchaseDate: account.purchaseDateInput,
            purchasedFrom: account.purchasedFrom ?? "",
            notes: account.notes ?? "",
          }
        : { ...emptyValues, purchaseDate: todayInput() },
    );
  }, [account, currency, form, open]);

  function closeDialog(value: boolean) {
    if (!value) {
      setImageFile(null);
      setImageRemoved(false);
    }
    onOpenChange(value);
  }

  async function onSubmit(values: AccountInput) {
    const result = account
      ? await updateAccountAction(account.id, {
          ...values,
          imageUrl: imageRemoved ? "" : values.imageUrl,
        })
      : await createAccountAction({ ...values, imageUrl: imageRemoved ? "" : values.imageUrl });
    if (!result.success) {
      for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (messages?.[0]) form.setError(field as keyof AccountInput, { message: messages[0] });
      }
      toast.error(result.message);
      return;
    }
    if (imageFile && result.accountId) {
      const uploadForm = new FormData();
      uploadForm.set("accountId", result.accountId);
      uploadForm.set("file", imageFile);
      const response = await fetch("/api/accounts/images", { method: "POST", body: uploadForm });
      if (!response.ok) {
        const uploadError = (await response.json()) as { error?: string };
        toast.warning(
          uploadError.error ??
            "Account saved, but the image upload failed. Edit the account to retry.",
        );
        closeDialog(false);
        router.refresh();
        return;
      }
    }
    toast.success(result.message);
    closeDialog(false);
    router.refresh();
  }

  const errors = form.formState.errors;
  const pending = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={(value) => !pending && closeDialog(value)}>
      <DialogContent className="flex max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 px-4 pt-4 pr-12 pb-3 sm:px-5 sm:pt-5 sm:pr-12">
          <DialogTitle>{account ? "Edit account" : "Add account"}</DialogTitle>
          <DialogDescription>
            Track purchase details only. Never store passwords, recovery codes, or session tokens.
          </DialogDescription>
        </DialogHeader>
        <form
          id="account-form"
          className="grid min-h-0 gap-x-grid gap-y-3 overflow-y-auto overscroll-contain px-4 pt-1 pb-4 sm:grid-cols-2 sm:px-5"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <Field label="Game name" error={errors.gameName?.message} required>
            <Controller
              control={form.control}
              name="gameName"
              render={({ field }) => (
                <GameNameInput
                  value={field.value}
                  onChange={field.onChange}
                  previousGames={games}
                  disabled={pending}
                />
              )}
            />
          </Field>
          <Field label="Account name" error={errors.accountName?.message} required>
            <Input
              {...form.register("accountName")}
              placeholder="Mythical Glory Account"
              disabled={pending}
              aria-invalid={Boolean(errors.accountName)}
            />
          </Field>
          <Field label="Purchase price" error={errors.purchasePrice?.message} required>
            <Controller
              control={form.control}
              name="purchasePrice"
              render={({ field }) => (
                <MoneyInput
                  currency={currency}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={currency === "IDR" ? "500.000" : "50.00"}
                  disabled={pending}
                  aria-invalid={Boolean(errors.purchasePrice)}
                />
              )}
            />
          </Field>
          <Field label="Purchase date" error={errors.purchaseDate?.message} required>
            <Input
              type="date"
              {...form.register("purchaseDate")}
              disabled={pending}
              aria-invalid={Boolean(errors.purchaseDate)}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Purchased from" error={errors.purchasedFrom?.message}>
              <Input
                {...form.register("purchasedFrom")}
                placeholder="Seller or source"
                disabled={pending}
              />
            </Field>
          </div>
          <fieldset className="min-w-0 space-y-1.5 sm:col-span-2">
            <legend className="text-sm font-medium">Account thumbnail</legend>
            <LocalImageInput
              existingUrl={account?.imageUrl ?? null}
              disabled={pending}
              onFile={(file) => {
                setImageFile(file);
                if (file) setImageRemoved(false);
              }}
              onRemove={() => setImageRemoved(true)}
            />
            {errors.imageUrl ? (
              <p className="text-xs text-destructive">{errors.imageUrl.message}</p>
            ) : null}
          </fieldset>
          <div>
            <Field label="Description" error={errors.description?.message}>
              <Textarea
                {...form.register("description")}
                placeholder="Account rank, collection, or other non-sensitive details"
                className="min-h-16"
                disabled={pending}
              />
            </Field>
          </div>
          <div>
            <Field label="Internal notes" error={errors.notes?.message}>
              <Textarea
                {...form.register("notes")}
                placeholder="Private business notes"
                className="min-h-16"
                disabled={pending}
              />
            </Field>
          </div>
        </form>
        <DialogFooter className="shrink-0 flex-row justify-end border-t px-4 py-3 sm:px-5">
          <Button
            type="button"
            variant="outline"
            onClick={() => closeDialog(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="submit" form="account-form" disabled={pending}>
            {pending ? <Loader2 className="motion-safe:animate-spin" aria-hidden="true" /> : null}
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
