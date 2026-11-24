import argon2 from "argon2";
import { signInSchema } from "@/schemas/auth";
import {
  clearAuthFailures,
  createThrottleKey,
  isAuthThrottled,
  recordAuthFailure,
} from "./auth-throttle";
import { db } from "./db";

const DUMMY_PASSWORD_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$MmJC4G7DVTt9xAQO3PLUxQ$QZGN5vEsrWtzNBAWHrQsa/l19ItJRTTg5cpcwzZImDQ";

export async function verifyCredentials(input: unknown, clientIdentifier: string) {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return null;

  const { email, password } = parsed.data;
  const throttleKey = createThrottleKey(email, clientIdentifier);
  if (await isAuthThrottled(throttleKey)) return null;

  const user = await db.user.findUnique({ where: { email } });
  const valid = await argon2.verify(user?.passwordHash ?? DUMMY_PASSWORD_HASH, password);
  if (!user || !valid) {
    await recordAuthFailure(throttleKey);
    return null;
  }

  await clearAuthFailures(throttleKey);
  return { id: user.id, name: user.name, email: user.email };
}
