import { formatMoney, type Currency } from "@/lib/money";
import { cn } from "@/lib/utils";

export function Money({
  value,
  currency,
  colored = false,
  className,
}: {
  value: bigint | number;
  currency: Currency;
  colored?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-medium tabular-nums",
        colored && value > 0 && "text-success",
        colored && value < 0 && "text-destructive",
        className,
      )}
    >
      {formatMoney(value, currency)}
    </span>
  );
}
