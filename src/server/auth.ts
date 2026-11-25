import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getAuthClientIdentifier } from "./auth-throttle";
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
        return verifyCredentials(credentials, getAuthClientIdentifier(request.headers));
      },
    }),
  ],
});
