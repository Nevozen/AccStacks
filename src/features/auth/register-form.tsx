"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAction } from "./actions";

const fields = [
  { name: "name", label: "Name", type: "text", autoComplete: "name", maxLength: 100 },
  { name: "email", label: "Email", type: "email", autoComplete: "email", maxLength: 254 },
  {
    name: "password",
    label: "Password",
    type: "password",
    autoComplete: "new-password",
    minLength: 12,
    maxLength: 256,
  },
  {
    name: "confirmPassword",
    label: "Confirm password",
    type: "password",
    autoComplete: "new-password",
    maxLength: 256,
  },
] as const;

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, null);
  const [identity, setIdentity] = useState({ name: "", email: "" });

  return (
    <>
      <form action={formAction} className="space-y-4">
        {fields.map(({ name, label, ...attributes }) => {
          const error = state?.fieldErrors?.[name]?.[0];
          const isIdentityField = name === "name" || name === "email";
          const hint = name === "password" ? "password-hint" : undefined;
          const errorId = error ? `${name}-error` : undefined;

          return (
            <div className="space-y-1.5" key={name}>
              <Label htmlFor={name}>{label}</Label>
              <Input
                {...attributes}
                id={name}
                name={name}
                className="h-10"
                required
                disabled={pending}
                aria-invalid={error ? true : undefined}
                aria-describedby={errorId ?? hint}
                value={isIdentityField ? identity[name] : undefined}
                onChange={
                  isIdentityField
                    ? (event) => setIdentity({ ...identity, [name]: event.target.value })
                    : undefined
                }
              />
              {hint && !error ? (
                <p className="text-xs text-muted-foreground" id={hint}>
                  Use at least 12 characters.
                </p>
              ) : null}
              {error ? (
                <p className="text-sm text-destructive" id={errorId}>
                  {error}
                </p>
              ) : null}
            </div>
          );
        })}
        {state ? (
          <p
            className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {state.message}
          </p>
        ) : null}
        <Button size="lg" className="w-full" type="submit" disabled={pending}>
          {pending ? "Creating account..." : "Create account"}
          {pending ? (
            <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />
          ) : (
            <ArrowRight aria-hidden="true" />
          )}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link className="font-medium text-foreground underline underline-offset-4" href="/login">
          Sign in
        </Link>
      </p>
    </>
  );
}
