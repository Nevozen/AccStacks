import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .max(254)
  .pipe(z.email())
  .transform((value) => value.toLowerCase());

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(256),
});

export const ownerCredentialsSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(100),
  email: emailSchema,
  password: z.string().min(12, "Use at least 12 characters.").max(256),
});

export const registrationSchema = ownerCredentialsSchema
  .extend({
    confirmPassword: z.string().min(1, "Confirm your password.").max(256),
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });
