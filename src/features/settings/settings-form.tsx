"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/shared/money-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export function SettingsForm({ defaultValues }: { defaultValues: SettingsInput }) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const form = useForm<SettingsInput>({
    resolver: zodResolver(settingsInputSchema),
    defaultValues,
  });
  const theme = useWatch({ control: form.control, name: "theme" });
  const timezone = useWatch({ control: form.control, name: "timezone" });
  const stockView = useWatch({ control: form.control, name: "preferredStockView" });
  const pending = form.formState.isSubmitting;

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
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Workspace preferences</CardTitle>
          <CardDescription>
            Control appearance, date reporting, and your default inventory layout.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label>Theme</Label>
            <Select
              value={theme}
              onValueChange={(value: SettingsInput["theme"]) => {
                form.setValue("theme", value, { shouldDirty: true });
                setTheme(value.toLowerCase());
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SYSTEM">System preference</SelectItem>
                <SelectItem value="LIGHT">Light</SelectItem>
                <SelectItem value="DARK">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Timezone</Label>
            <Select
              value={timezone}
              onValueChange={(value) => form.setValue("timezone", value, { shouldDirty: true })}
            >
              <SelectTrigger>
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
            <p className="text-xs text-muted-foreground">
              Used for date inputs, displays, reporting boundaries, and exports. Timestamps remain
              UTC in PostgreSQL.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Owner capital</Label>
            <Controller
              control={form.control}
              name="capital"
              render={({ field }) => (
                <MoneyInput
                  value={field.value ?? "0"}
                  onChange={field.onChange}
                  disabled={pending}
                />
              )}
            />
            <p className="text-xs text-muted-foreground">
              Owner funding used as the basis for estimated cash, assets, and equity. Inventory
              remains a separate asset.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Input value="IDR — Indonesian Rupiah" disabled />
            <p className="text-xs text-muted-foreground">
              All financial values are stored as whole Rupiah.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Preferred stock view</Label>
            <Select
              value={stockView}
              onValueChange={(value: SettingsInput["preferredStockView"]) =>
                form.setValue("preferredStockView", value, { shouldDirty: true })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GRID">Card grid</SelectItem>
                <SelectItem value="TABLE">Compact table</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={pending || !form.formState.isDirty}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            Save preferences
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
