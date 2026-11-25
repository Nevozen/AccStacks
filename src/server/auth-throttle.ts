import { createHmac, randomUUID } from "node:crypto";
import { isIP } from "node:net";
import { db } from "./db";

const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const MAX_REGISTRATIONS = 8;

export function getAuthClientIdentifier(headers: Pick<Headers, "get">) {
  // Use the address set by the nearest proxy, not client-supplied entries in the list.
  const forwardedFor = headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  const address = forwardedFor || headers.get("x-real-ip")?.trim();
  return address && isIP(address) ? address : "unknown-client";
}

export function createThrottleKey(email: string, clientIdentifier: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required");
  return createHmac("sha256", secret).update(`${email}|${clientIdentifier}`).digest("hex");
}

export async function reserveRegistrationAttempt(clientIdentifier: string) {
  const key = createThrottleKey("registration", clientIdentifier);
  const now = new Date();
  const cutoff = new Date(now.getTime() - WINDOW_MS);

  // Reserve a slot before hashing, including when several requests arrive at once.
  const reserved = await db.$executeRaw`
    INSERT INTO "AuthThrottle" ("id", "key", "failureCount", "windowStartedAt", "updatedAt")
    VALUES (${randomUUID()}, ${key}, 1, ${now}, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "failureCount" = CASE WHEN "AuthThrottle"."windowStartedAt" <= ${cutoff}
                            THEN 1 ELSE "AuthThrottle"."failureCount" + 1 END,
      "windowStartedAt" = CASE WHEN "AuthThrottle"."windowStartedAt" <= ${cutoff}
                               THEN ${now} ELSE "AuthThrottle"."windowStartedAt" END,
      "updatedAt" = ${now}
    WHERE "AuthThrottle"."windowStartedAt" <= ${cutoff}
       OR "AuthThrottle"."failureCount" < ${MAX_REGISTRATIONS}
  `;
  return reserved === 1;
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
