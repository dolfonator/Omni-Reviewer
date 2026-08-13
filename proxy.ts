/**
 * Auth gate (Next.js 16 proxy; formerly middleware).
 *
 * Matcher runs on app pages and /api/* (static assets excluded below).
 *
 * Unauthenticated behavior:
 * - Pages (except /login) → redirect to /login
 * - /api/auth/* → always allowed (Auth.js handlers)
 * - POST /api/blob/upload → exempt from session 401 so Vercel Blob's
 *   onUploadCompleted callback (no session cookie) can reach handleUpload,
 *   which verifies Blob's own token. t4 owns that route; source rows are
 *   created later via a session-gated POST, not from the callback.
 * - All other /api/* → 401 JSON (not a redirect), for fetch callers
 */
import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;
  const isLoginPage = pathname === "/login";
  const isAuthApi =
    pathname === "/api/auth" || pathname.startsWith("/api/auth/");
  const isApi = pathname.startsWith("/api/");
  const isBlobUploadCallback =
    pathname === "/api/blob/upload" && req.method === "POST";

  if (isAuthApi || isBlobUploadCallback) {
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    if (isApi) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }
    if (!isLoginPage) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (isLoginPage) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all pathnames except Next static assets and common public files.
     * Includes /api/* so unauthenticated API calls get 401 JSON.
     * POST /api/blob/upload is exempted in the handler (Blob callback; see top comment).
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
