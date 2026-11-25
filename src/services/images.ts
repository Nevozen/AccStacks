import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { AppError } from "@/lib/errors";
import { isValidStoredImageId, validateImageBytes } from "@/lib/image-files";
import { db } from "@/server/db";

function uploadRoot() {
  const configuredDirectory = process.env.ACCSTACKS_UPLOAD_DIR;
  if (configuredDirectory) return configuredDirectory;

  return process.env.NODE_ENV === "production"
    ? path.join("/data", "uploads")
    : path.join(process.cwd(), ".data", "uploads");
}

function storedImageUrl(id: string) {
  return `/api/uploads/${id}`;
}

function storedImagePath(id: string) {
  // Private uploads are runtime data, not part of the standalone build.
  return path.join(/* turbopackIgnore: true */ uploadRoot(), id);
}

async function deleteStoredImage(imageUrl: string | null) {
  if (!imageUrl?.startsWith("/api/uploads/")) return;
  const id = imageUrl.slice("/api/uploads/".length);
  if (!isValidStoredImageId(id)) return;
  try {
    await unlink(storedImagePath(id));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

export async function uploadAccountImage(ownerId: string, accountId: string, file: File) {
  const account = await db.account.findFirst({
    where: { id: accountId, ownerId, deletedAt: null, sale: null },
    select: { id: true, imageUrl: true },
  });
  if (!account) throw new AppError("NOT_FOUND", "Eligible account not found");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = validateImageBytes(bytes);
  const id = `${randomUUID()}.${kind.extension}`;
  const imagePath = storedImagePath(id);
  await mkdir(uploadRoot(), { recursive: true });
  await writeFile(imagePath, bytes, { flag: "wx" });
  const imageUrl = storedImageUrl(id);

  try {
    await db.account.update({ where: { id: account.id }, data: { imageUrl } });
  } catch (error) {
    await unlink(imagePath).catch(() => undefined);
    throw error;
  }
  if (account.imageUrl !== imageUrl) await deleteStoredImage(account.imageUrl);
  return imageUrl;
}

export async function removeStoredImage(imageUrl: string | null) {
  await deleteStoredImage(imageUrl);
}

export async function readAccountImage(ownerId: string, imageId: string) {
  if (!isValidStoredImageId(imageId)) return null;
  const account = await db.account.findFirst({
    where: { ownerId, imageUrl: storedImageUrl(imageId), deletedAt: null },
    select: { id: true },
  });
  if (!account) return null;
  try {
    const bytes = await readFile(/* turbopackIgnore: true */ storedImagePath(imageId));
    const kind = validateImageBytes(bytes);
    return { bytes, contentType: kind.mime };
  } catch {
    return null;
  }
}
