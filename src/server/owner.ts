import argon2 from "argon2";
import { ownerCredentialsSchema } from "@/schemas/auth";
import { db } from "./db";

export async function provisionOwner(input: unknown) {
  const credentials = ownerCredentialsSchema.parse(input);
  const passwordHash = await argon2.hash(credentials.password, {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });

  return db.$transaction(async (tx) => {
    const existingOwner = await tx.user.findFirst({ select: { id: true, email: true } });
    if (existingOwner && existingOwner.email !== credentials.email) {
      throw new Error("An owner already exists. Public registration is disabled.");
    }

    const user = await tx.user.upsert({
      where: { email: credentials.email },
      update: { name: credentials.name, passwordHash },
      create: {
        name: credentials.name,
        email: credentials.email,
        passwordHash,
        settings: { create: {} },
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
