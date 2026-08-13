import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config. No node:crypto / timingSafeEqual here —
 * middleware/proxy imports this file only. Credentials authorize lives in auth.ts.
 */
export const authConfig = {
  // Honor AUTH_TRUST_HOST so first production deploy works before AUTH_URL exists.
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  // Providers with Node-only authorize are added in auth.ts.
  providers: [],
  callbacks: {
    authorized() {
      // Custom gate logic lives in proxy.ts (redirect vs 401 JSON).
      return true;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
