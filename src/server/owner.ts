import { ownerCredentialsSchema } from "@/schemas/auth";
import { hashPassword } from "./credentials";
import { db } from "./db";

export async function provisionOwner(input: unknown) {
  const credentials = ownerCredentialsSchema.parse(input);
  const passwordHash = await hashPassword(credentials.password);

  return db.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { email: credentials.email },
      update: { name: credentials.name, passwordHash },
      create: {
        name: credentials.name,
        email: credentials.email,
        passwordHash,
        settings: { create: { currency: null } },
      },
      select: { id: true, name: true, email: true },
    });

    await tx.userSettings.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    return user;
  });
}
