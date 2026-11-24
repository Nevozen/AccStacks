"use client";

import { forwardRef } from "react";
import { Input } from "@/components/ui/input";

function groupDigits(value: string) {
  const digits = value.replace(/^0+(?=\d)/, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export const MoneyInput = forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<"input">, "value" | "onChange"> & {
    value: string;
    onChange: (value: string) => void;
  }
>(function MoneyInput({ value, onChange, ...props }, ref) {
  return (
    <span className="relative block">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
        Rp
      </span>
      <Input
        {...props}
        ref={ref}
        className="pl-9 text-right tabular-nums"
        inputMode="numeric"
        autoComplete="off"
        value={groupDigits(value)}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 16))}
      />
    </span>
  );
});
