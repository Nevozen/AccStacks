"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CurrencyIdentity } from "@/components/shared/currency-identity";
import { MoneyInput } from "@/components/shared/money-input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { Currency } from "@/lib/money";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { settingsInputSchema, type SettingsInput } from "@/schemas/settings";
import { updateSettingsAction } from "./actions";

const timezones = [
  "Asia/Jakarta",
  "Asia/Singapore",
  "UTC",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
];

export function SettingsForm({
  defaultValues,
  currency,
}: {
  defaultValues: SettingsInput;
  currency: Currency;
}) {
  const router = useRouter();
  const form = useForm<SettingsInput>({
    resolver: zodResolver(settingsInputSchema(currency)),
    defaultValues,
  });
  const timezone = useWatch({ control: form.control, name: "timezone" });
  const stockView = useWatch({ control: form.control, name: "preferredStockView" });
  const pending = form.formState.isSubmitting;
  const capitalError = form.formState.errors.capital?.message;

  async function onSubmit(values: SettingsInput) {
    const result = await updateSettingsAction(values);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    form.reset(values);
    router.refresh();
  }

  return (
    <form className="min-w-0 space-y-grid" onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <h2 className="text-[15px] font-semibold">Workspace preferences</h2>
        </CardHeader>
        <CardContent className="grid gap-grid sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="workspace-timezone">Timezone</Label>
            <Select
              value={timezone}
              onValueChange={(value) => form.setValue("timezone", value, { shouldDirty: true })}
            >
              <SelectTrigger
                id="workspace-timezone"
                disabled={pending}
                aria-describedby="timezone-help"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[...new Set([...timezones, defaultValues.timezone])].map((zone) => (
                  <SelectItem key={zone} value={zone}>
                    {zone.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p id="timezone-help" className="text-xs text-muted-foreground">
              Used to display dates, set reporting boundaries, and format exports.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="workspace-stock-view">Preferred stock view</Label>
            <Select
              value={stockView}
              onValueChange={(value: SettingsInput["preferredStockView"]) =>
                form.setValue("preferredStockView", value, { shouldDirty: true })
              }
            >
              <SelectTrigger id="workspace-stock-view" disabled={pending}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GRID">Card grid</SelectItem>
                <SelectItem value="TABLE">Compact table</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <dl className="sm:col-span-2">
            <dt className="text-sm font-medium">Currency</dt>
            <dd className="mt-1.5 rounded-md border p-2">
              <CurrencyIdentity currency={currency} />
            </dd>
          </dl>
        </CardContent>
      </Card>
      <Card id="capital" className="scroll-mt-18">
        <CardHeader>
          <h2 className="text-[15px] font-semibold">Capital</h2>
          <p id="capital-help" className="text-sm text-muted-foreground">
            Owner funding used to estimate equity and cash. Editing capital does not change recorded
            sales.
          </p>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <Label htmlFor="owner-capital">Owner capital ({currency})</Label>
          <div className="max-w-64">
            <Controller
              control={form.control}
              name="capital"
              render={({ field }) => (
                <MoneyInput
                  id="owner-capital"
                  currency={currency}
                  ref={field.ref}
                  value={field.value ?? "0"}
                  onChange={field.onChange}
                  disabled={pending}
                  aria-invalid={Boolean(capitalError)}
                  aria-describedby={capitalError ? "capital-help capital-error" : "capital-help"}
                />
              )}
            />
          </div>
          {capitalError ? (
            <p id="capital-error" role="alert" className="text-xs text-destructive">
              {capitalError}
            </p>
          ) : null}
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending || !form.formState.isDirty}>
          {pending ? <Loader2 className="motion-safe:animate-spin" aria-hidden="true" /> : null}
          Save preferences
        </Button>
      </div>
    </form>
  );
}
