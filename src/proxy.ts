import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/server/auth.config";

const { auth } = NextAuth(authConfig);

export async function proxy(request: NextRequest) {
  // Check the session without refreshing cookies on prefetched routes.
  const session = await auth();
  if (session?.user?.id) return;

  const loginUrl = new URL("/login", process.env.AUTH_URL ?? request.url);
  loginUrl.searchParams.set("callbackUrl", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return Response.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/overview/:path*",
    "/analytics/:path*",
    "/stocks/:path*",
    "/listings/:path*",
    "/settings/:path*",
  ],
};
