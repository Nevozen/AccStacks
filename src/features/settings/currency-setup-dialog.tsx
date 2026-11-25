"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { CurrencyIdentity } from "@/components/shared/currency-identity";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CURRENCIES, type Currency } from "@/lib/money";
import { chooseCurrencyAction } from "./actions";

export function CurrencySetupDialog() {
  const router = useRouter();
  const [currency, setCurrency] = useState<Currency>();
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!currency || pending) return;
    setPending(true);
    setError(undefined);
    const result = await chooseCurrencyAction(currency);
    setPending(false);
    if (!result.success) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <Dialog open>
      <DialogContent
        className="max-w-md"
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <p className="font-mono text-xs font-medium tracking-wide text-accent-foreground uppercase">
            Workspace setup / 01
          </p>
          <DialogTitle>Choose your workspace currency</DialogTitle>
          <DialogDescription>
            This currency applies to purchases, sales, capital, and reports. It cannot be changed
            after setup.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <fieldset className="space-y-2" disabled={pending}>
            <legend className="sr-only">Workspace currency</legend>
            {CURRENCIES.map((code) => (
              <label
                key={code}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-input p-3 hover:bg-muted/70 has-checked:border-ring has-checked:bg-accent/55 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring"
              >
                <input
                  type="radio"
                  name="currency"
                  value={code}
                  className="size-4 shrink-0 accent-ring"
                  checked={currency === code}
                  onChange={() => setCurrency(code)}
                />
                <span className="min-w-0 flex-1">
                  <CurrencyIdentity currency={code} />
                </span>
              </label>
            ))}
          </fieldset>
          {error ? (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={!currency || pending}>
            Continue
            {pending ? (
              <Loader2 aria-hidden="true" className="motion-safe:animate-spin" />
            ) : (
              <ArrowRight aria-hidden="true" />
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
