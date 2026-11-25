import { Prisma } from "@/generated/prisma/client";
import { AppError } from "@/lib/errors";
import { registrationSchema } from "@/schemas/auth";
import { reserveRegistrationAttempt } from "@/server/auth-throttle";
import { hashPassword } from "@/server/credentials";
import { db } from "@/server/db";

export async function registerUser(input: unknown, clientIdentifier: string) {
  const { name, email, password } = registrationSchema.parse(input);
  if (!(await reserveRegistrationAttempt(clientIdentifier))) {
    throw new AppError("FORBIDDEN", "Too many attempts. Please try again later.");
  }

  const passwordHash = await hashPassword(password);

  try {
    return await db.user.create({
      data: { name, email, passwordHash, settings: { create: { currency: null } } },
      select: { id: true, email: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError(
        "CONFLICT",
        "Unable to create an account with these details. If you already have an account, sign in.",
      );
    }
    throw error;
  }
}
