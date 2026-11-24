import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export function Money({
  value,
  colored = false,
  className,
}: {
  value: bigint | number;
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
      {formatMoney(value)}
    </span>
  );
}
