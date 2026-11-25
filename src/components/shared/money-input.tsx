"use client";

import { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { currencyDetails, type Currency } from "@/lib/money";
import { cn } from "@/lib/utils";

export const MoneyInput = forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<"input">, "value" | "onChange"> & {
    currency: Currency;
    value: string;
    onChange: (value: string) => void;
  }
>(function MoneyInput({ currency, value, onChange, className, ...props }, ref) {
  const rupiah = currency === "IDR";
  return (
    <span className="relative block">
      <span
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground"
        aria-hidden="true"
      >
        {currencyDetails[currency].symbol}
      </span>
      <Input
        {...props}
        ref={ref}
        className={cn("pl-9 text-right tabular-nums", className)}
        inputMode={rupiah ? "numeric" : "decimal"}
        autoComplete="off"
        maxLength={24}
        value={value}
        onChange={(event) => {
          const text = event.target.value;
          const grouping = rupiah ? /^\d{1,3}(\.\d{3})+$/ : /^\d{1,3}(,\d{3})+(\.\d{1,2})?$/;
          onChange(grouping.test(text) ? text.replaceAll(rupiah ? "." : ",", "") : text);
        }}
      />
    </span>
  );
});
