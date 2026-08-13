import { z } from "zod";

const envSchema = z.object({
  APP_PASSWORD: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  AUTH_TRUST_HOST: z.string().optional(),
  AUTH_URL: z.string().optional(),
  DATABASE_URL: z.string().min(1),
  BLOB_READ_WRITE_TOKEN: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  AI_MODEL: z.string().default("gemini-3.7-flash"),
});

export type Env = z.infer<typeof envSchema>;

function isBuildPhase(): boolean {
  return (
    process.env.CI === "true" ||
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PHASE === "phase-export"
  );
}

let cached: Env | null = null;

/**
 * Validate and return runtime env. Safe during `next build` when secrets
 * are absent (returns a partial best-effort object only if building).
 * Production request paths should call this and expect validation.
 */
export function getEnv(): Env {
  if (cached) return cached;

  const result = envSchema.safeParse({
    APP_PASSWORD: process.env.APP_PASSWORD,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
    AUTH_URL: process.env.AUTH_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    AI_MODEL: process.env.AI_MODEL ?? "gemini-3.7-flash",
  });

  if (result.success) {
    cached = result.data;
    return cached;
  }

  if (isBuildPhase()) {
    // Do not throw during build/CI when runtime secrets are not present.
    return {
      APP_PASSWORD: process.env.APP_PASSWORD ?? "",
      AUTH_SECRET: process.env.AUTH_SECRET ?? "",
      AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
      AUTH_URL: process.env.AUTH_URL,
      DATABASE_URL: process.env.DATABASE_URL ?? "",
      BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN ?? "",
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? "",
      AI_MODEL: process.env.AI_MODEL ?? "gemini-3.7-flash",
    };
  }

  throw new Error(
    `Invalid environment variables: ${result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ")}`,
  );
}

export function getOptionalEnv<K extends keyof Env>(key: K): Env[K] | undefined {
  return process.env[key as string] as Env[K] | undefined;
}
