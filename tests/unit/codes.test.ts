import { describe, expect, it } from "vitest";
import { buildAccountCode, buildListingCode, gameInitials, gamePrefix } from "@/lib/codes";

describe("public account and listing codes", () => {
  it("builds initials from each game word", () => {
    expect(gameInitials("Wuthering Waves")).toBe("WW");
    expect(gameInitials("Where Winds Meet")).toBe("WWM");
    expect(gameInitials("Free Fire")).toBe("FF");
    expect(gameInitials("  mobile   legends ")).toBe("ML");
  });

  it("adds deterministic suffixes for prefix collisions", () => {
    expect(gamePrefix("Wuthering Waves", [])).toBe("WW");
    expect(gamePrefix("Wuthering Wannabe", ["WW"])).toBe("WWA");
    expect(gamePrefix("Wuthering Whatever", ["WW", "WWA"])).toBe("WWB");
    expect(
      gamePrefix(
        "Wuthering Whatever",
        Array.from({ length: 27 }, (_, index) =>
          index === 0 ? "WW" : `WW${String.fromCharCode(64 + index)}`,
        ),
      ),
    ).toBe("WWAA");
  });

  it("formats linked account and listing codes", () => {
    expect(buildAccountCode("WW", 1)).toBe("WW1");
    expect(buildAccountCode("WWA", 2)).toBe("WWA2");
    expect(buildListingCode("WW1", 3)).toBe("WW1-3");
  });
});
