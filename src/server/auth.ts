import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { verifyCredentials } from "./credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
        const clientIdentifier =
          forwardedFor ?? request.headers.get("x-real-ip") ?? "unknown-client";
        return verifyCredentials(credentials, clientIdentifier);
      },
    }),
  ],
});
