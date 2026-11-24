import NextAuth from "next-auth";
import { authConfig } from "@/server/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const isLoggedIn = Boolean(request.auth?.user);
  const isLoginPage = request.nextUrl.pathname === "/login";

  if (!isLoggedIn && !isLoginPage) {
    const loginUrl = new URL("/login", request.nextUrl);
    if (request.nextUrl.pathname !== "/") {
      loginUrl.searchParams.set(
        "callbackUrl",
        `${request.nextUrl.pathname}${request.nextUrl.search}`,
      );
    }
    return Response.redirect(loginUrl);
  }

  if (isLoggedIn && isLoginPage) {
    return Response.redirect(new URL("/", request.nextUrl));
  }
});

export const config = {
  matcher: [
    "/",
    "/overview/:path*",
    "/stocks/:path*",
    "/listings/:path*",
    "/settings/:path*",
    "/login",
  ],
};
