import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { CredentialsSignin } from "next-auth";

import { authConfig } from "./auth.config";
import { safeEqualPassword } from "./lib/auth-utils";

class ServerMisconfigured extends CredentialsSignin {
  code = "server_misconfigured";
}

class InvalidPassword extends CredentialsSignin {
  code = "invalid_password";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "credentials",
      name: "Password",
      credentials: {
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const appPassword = process.env.APP_PASSWORD;
        const authSecret = process.env.AUTH_SECRET;

        if (!appPassword || !authSecret) {
          throw new ServerMisconfigured();
        }

        const password =
          typeof credentials?.password === "string"
            ? credentials.password
            : "";

        if (!password || !safeEqualPassword(password, appPassword)) {
          throw new InvalidPassword();
        }

        return {
          id: "tristan",
          name: "tristan",
        };
      },
    }),
  ],
});
