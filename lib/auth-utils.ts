import { timingSafeEqual } from "node:crypto";

/**
 * Timing-safe string compare for the app password gate.
 * Returns false when lengths differ (timingSafeEqual requires equal-length buffers).
 * Node-only — do not import from Edge (auth.config / proxy).
 */
export function safeEqualPassword(
  provided: string,
  expected: string,
): boolean {
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}
