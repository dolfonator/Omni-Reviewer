import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { safeEqualPassword } from "@/lib/auth-utils";

const root = path.resolve(__dirname, "..");

describe("auth", () => {
  it("timing-safe compare rejects a wrong password", () => {
    expect(safeEqualPassword("correct-horse", "correct-horse")).toBe(true);
    expect(safeEqualPassword("wrong-password", "correct-horse")).toBe(false);
    expect(safeEqualPassword("short", "correct-horse")).toBe(false);
    expect(safeEqualPassword("correct-horse!", "correct-horse")).toBe(false);
  });

  it("login Client Component does not read APP_PASSWORD", () => {
    const loginForm = readFileSync(
      path.join(root, "components/login-form.tsx"),
      "utf8",
    );
    expect(loginForm).toMatch(/["']use client["']/);
    expect(loginForm).not.toContain("APP_PASSWORD");
    expect(loginForm).not.toContain("process.env.APP_PASSWORD");
    expect(loginForm).not.toContain("process.env");
  });

  it("login page is a Server Component (password env stays server-side)", () => {
    const loginPage = readFileSync(
      path.join(root, "app/login/page.tsx"),
      "utf8",
    );
    expect(loginPage).not.toMatch(/^["']use client["']/m);
    // Server action may check env; Client Component must not (covered above).
    expect(loginPage).toContain("use server");
  });
});
