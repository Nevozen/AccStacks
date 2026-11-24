"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { AccountThumbnail } from "@/components/shared/account-thumbnail";
import { AccountStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AccountStatus } from "@/lib/account-status";

type Result = {
  id: string;
  accountCode: string;
  accountName: string;
  gameName: string;
  imageUrl: string | null;
  purchasePrice: string;
  status: AccountStatus;
};

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open || !query.trim()) return;
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search/accounts?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = (await response.json()) as { accounts: Result[] };
        setResults(data.accounts);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [open, query]);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-9 px-0 sm:w-52 sm:justify-start sm:px-3"
        onClick={() => setOpen(true)}
      >
        <Search />
        <span className="hidden text-muted-foreground sm:inline">Search accounts…</span>
        <kbd className="ml-auto hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground md:inline">
          ⌘K
        </kbd>
        <span className="sr-only sm:hidden">Search accounts</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-[20%] max-w-xl translate-y-0 p-0" showCloseButton={false}>
          <DialogHeader className="sr-only">
            <DialogTitle>Global account search</DialogTitle>
            <DialogDescription>Search accounts by name, game, or account ID.</DialogDescription>
          </DialogHeader>
          <Command shouldFilter={false} className="rounded-xl">
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Search account name, game, or ID…"
              autoFocus
            />
            <CommandList className="max-h-80">
              <CommandEmpty>
                {query.trim()
                  ? loading
                    ? "Searching…"
                    : "No matching accounts"
                  : "Type to search your inventory."}
              </CommandEmpty>
              <CommandGroup>
                {results.map((account) => (
                  <CommandItem
                    key={account.id}
                    value={account.id}
                    onSelect={() => {
                      setOpen(false);
                      setQuery("");
                      setResults([]);
                      router.push(`/stocks?account=${account.id}`);
                    }}
                  >
                    <AccountThumbnail src={account.imageUrl} alt="" className="size-9" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{account.accountName}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {account.gameName} · {account.accountCode}
                      </span>
                    </span>
                    <AccountStatusBadge status={account.status} />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
