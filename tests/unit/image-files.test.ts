import { describe, expect, it } from "vitest";
import {
  detectImageKind,
  isValidStoredImageId,
  MAX_IMAGE_BYTES,
  validateImageBytes,
} from "@/lib/image-files";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9WlF8AAAAASUVORK5CYII=",
  "base64",
);

describe("private image files", () => {
  it("detects supported signatures", () => {
    expect(detectImageKind(png)?.extension).toBe("png");
    expect(detectImageKind(Uint8Array.from([0xff, 0xd8, 0xff, 0x00]))?.extension).toBe("jpg");
    expect(detectImageKind(Buffer.from("RIFF1234WEBP", "ascii"))?.extension).toBe("webp");
  });

  it("rejects disguised and oversized files", () => {
    expect(() => validateImageBytes(Buffer.from("not a real image"))).toThrow("Only valid");
    expect(() => validateImageBytes(new Uint8Array(MAX_IMAGE_BYTES + 1))).toThrow("at most 3 MB");
  });

  it("accepts only generated UUID filenames with supported extensions", () => {
    expect(isValidStoredImageId("123e4567-e89b-12d3-a456-426614174000.png")).toBe(true);
    expect(isValidStoredImageId("../../etc/passwd")).toBe(false);
    expect(isValidStoredImageId("123e4567-e89b-12d3-a456-426614174000.svg")).toBe(false);
  });
});
