"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { POPULAR_GAMES } from "@/lib/games";
import { normalizeCategory } from "@/lib/normalization";

export function GameNameInput({
  value,
  onChange,
  previousGames,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  previousGames: string[];
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const options = useMemo(() => {
    const query = normalizeCategory(value);
    if (!query) return [];
    return [...previousGames, ...POPULAR_GAMES]
      .filter(
        (game, index, all) =>
          all.findIndex((item) => normalizeCategory(item) === normalizeCategory(game)) === index,
      )
      .filter((game) => normalizeCategory(game).includes(query))
      .sort((a, b) => {
        const aStarts = normalizeCategory(a).startsWith(query) ? 0 : 1;
        const bStarts = normalizeCategory(b).startsWith(query) ? 0 : 1;
        return aStarts - bStarts || a.localeCompare(b);
      })
      .slice(0, 8);
  }, [previousGames, value]);

  function select(game: string) {
    onChange(game);
    setOpen(false);
  }

  return (
    <Popover open={open && value.trim().length > 0} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Input
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && options[0]) {
              event.preventDefault();
              select(options[0]);
            }
          }}
          placeholder="Type a game, e.g. Wuthering Waves"
          autoComplete="off"
          disabled={disabled}
        />
      </PopoverAnchor>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandList>
            <CommandEmpty>Use “{value}” as a custom game.</CommandEmpty>
            <CommandGroup>
              {options.map((game) => (
                <CommandItem key={game} value={game} onSelect={() => select(game)}>
                  <span className="flex-1">{game}</span>
                  {normalizeCategory(game) === normalizeCategory(value) ? (
                    <Check className="size-4" />
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
