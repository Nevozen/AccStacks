import { normalizeName } from "./normalization";

export function gameInitials(gameName: string) {
  const initials = normalizeName(gameName)
    .split(" ")
    .map((word) => Array.from(word)[0])
    .filter((character) => /[\p{L}\p{N}]/u.test(character))
    .join("")
    .toUpperCase();
  return initials || "GAME";
}

function suffix(index: number) {
  let value = index + 1;
  let result = "";
  while (value > 0) {
    value -= 1;
    result = String.fromCharCode(65 + (value % 26)) + result;
    value = Math.floor(value / 26);
  }
  return result;
}

export function gamePrefix(gameName: string, existingPrefixes: readonly string[]) {
  const base = gameInitials(gameName);
  const used = new Set(existingPrefixes);
  if (!used.has(base)) return base;
  for (let index = 0; ; index += 1) {
    const candidate = `${base}${suffix(index)}`;
    if (!used.has(candidate)) return candidate;
  }
}

export function buildAccountCode(prefix: string, sequence: number) {
  if (!Number.isInteger(sequence) || sequence < 1) throw new RangeError("Invalid account sequence");
  return `${prefix}${sequence}`;
}

export function buildListingCode(accountCode: string, sequence: number) {
  if (!Number.isInteger(sequence) || sequence < 1) throw new RangeError("Invalid listing sequence");
  return `${accountCode}-${sequence}`;
}
