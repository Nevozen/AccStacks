"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CollectionSearch({
  value,
  label,
  placeholder,
  onSearch,
}: {
  value: string;
  label: string;
  placeholder: string;
  onSearch: (value: string) => void;
}) {
  return (
    <form
      className="relative min-w-0 flex-1"
      role="search"
      aria-label={label}
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(String(new FormData(event.currentTarget).get("q") ?? "").trim());
      }}
    >
      <Input
        key={value}
        name="q"
        type="search"
        defaultValue={value}
        maxLength={150}
        className="pr-11 [&::-webkit-search-cancel-button]:mr-1"
        placeholder={placeholder}
        aria-label={label}
      />
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        className="absolute top-0.5 right-0.5 text-muted-foreground"
        aria-label={`Apply ${label.toLowerCase()}`}
      >
        <Search aria-hidden="true" />
      </Button>
    </form>
  );
}

export function CollectionPagination({
  page,
  totalPages,
  count,
  pending,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  count: number;
  pending: boolean;
  onPageChange: (page: number) => void;
}) {
  if (!count) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-1 text-xs text-muted-foreground">
      <p role="status" className="tabular-nums">
        {count} {count === 1 ? "result" : "results"}
        {totalPages > 1 ? ` / Page ${page} of ${totalPages}` : ""}
      </p>
      {totalPages > 1 ? (
        <nav className="flex gap-2" aria-label="Pagination">
          <Button
            variant="outline"
            size="sm"
            disabled={pending || page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft aria-hidden="true" /> Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pending || page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next <ChevronRight aria-hidden="true" />
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
