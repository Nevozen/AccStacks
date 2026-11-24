import { createHmac } from "node:crypto";
import { db } from "./db";

const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

export function createThrottleKey(email: string, clientIdentifier: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required");
  return createHmac("sha256", secret).update(`${email}|${clientIdentifier}`).digest("hex");
}

export async function isAuthThrottled(key: string) {
  const throttle = await db.authThrottle.findUnique({
    where: { key },
    select: { blockedUntil: true },
  });
  return Boolean(throttle?.blockedUntil && throttle.blockedUntil > new Date());
}

export async function recordAuthFailure(key: string) {
  const now = new Date();
  const existing = await db.authThrottle.findUnique({ where: { key } });
  const windowExpired =
    !existing || existing.windowStartedAt.getTime() + WINDOW_MS <= now.getTime();
  const failureCount = !existing || windowExpired ? 1 : existing.failureCount + 1;
  const blockedUntil = failureCount >= MAX_FAILURES ? new Date(now.getTime() + BLOCK_MS) : null;

  await db.authThrottle.upsert({
    where: { key },
    update: {
      failureCount,
      windowStartedAt: !existing || windowExpired ? now : existing.windowStartedAt,
      blockedUntil,
    },
    create: { key, failureCount, windowStartedAt: now, blockedUntil },
  });
}

export async function clearAuthFailures(key: string) {
  await db.authThrottle.updateMany({
    where: { key },
    data: { failureCount: 0, windowStartedAt: new Date(), blockedUntil: null },
  });
}
