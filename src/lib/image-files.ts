export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

export type ImageKind = {
  extension: "jpg" | "png" | "webp";
  mime: "image/jpeg" | "image/png" | "image/webp";
};

export function detectImageKind(bytes: Uint8Array): ImageKind | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { extension: "jpg", mime: "image/jpeg" };
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { extension: "png", mime: "image/png" };
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { extension: "webp", mime: "image/webp" };
  }
  return null;
}

export function validateImageBytes(bytes: Uint8Array) {
  if (bytes.length === 0) throw new Error("Image file is empty");
  if (bytes.length > MAX_IMAGE_BYTES) throw new Error("Image must be at most 3 MB");
  const kind = detectImageKind(bytes);
  if (!kind) throw new Error("Only valid JPEG, PNG, and WebP images are supported");
  return kind;
}

export function isValidStoredImageId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp)$/.test(
    value,
  );
}
