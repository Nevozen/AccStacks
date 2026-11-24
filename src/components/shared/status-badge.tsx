import { Badge } from "@/components/ui/badge";
import type { AccountStatus } from "@/lib/account-status";
import { cn } from "@/lib/utils";

export function AccountStatusBadge({
  status,
  className,
}: {
  status: AccountStatus;
  className?: string;
}) {
  return (
    <Badge
      variant={status === "AVAILABLE" ? "success" : status === "LISTED" ? "info" : "secondary"}
      className={cn("uppercase", status === "SOLD" && "bg-foreground text-background", className)}
    >
      {status}
    </Badge>
  );
}
