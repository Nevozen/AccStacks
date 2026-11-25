"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MoneyInput } from "@/components/shared/money-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { updateCapitalAction } from "./actions";

export function CapitalSetupDialog({ open }: { open: boolean }) {
  const router = useRouter();
  const [capital, setCapital] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    if (!/^\d+$/.test(capital)) {
      setError("Enter your starting capital in whole Rupiah");
      return;
    }
    setPending(true);
    setError(null);
    const result = await updateCapitalAction(capital);
    setPending(false);
    if (!result.success) {
      setError(result.message);
      return;
    }
    toast.success(result.message);
    router.refresh();
  }

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-md"
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Set your starting capital</DialogTitle>
          <DialogDescription>
            Start with the amount you put into the business. This is used to estimate cash and
            equity. Zero is valid.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="starting-capital">Starting capital (IDR)</Label>
            <MoneyInput
              id="starting-capital"
              value={capital}
              onChange={setCapital}
              disabled={pending}
              placeholder="1.000.000"
              autoFocus
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "starting-capital-error" : undefined}
            />
            {error ? (
              <p id="starting-capital-error" className="text-xs text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            Save starting capital
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
