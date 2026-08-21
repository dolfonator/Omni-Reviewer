import { z } from "zod";

export const GENERATE_KINDS = [
  "locked_in",
  "summary",
  "test_me",
  "carded",
] as const;

export type GenerateKind = (typeof GENERATE_KINDS)[number];

const bodySchema = z.object({
  kind: z.enum(GENERATE_KINDS).optional(),
});

export function parseGenerateBody(
  raw: string,
): { ok: true; kind: GenerateKind } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, kind: "locked_in" };

  let json: unknown;
  try {
    json = JSON.parse(trimmed);
  } catch {
    return { ok: false, error: "Invalid JSON body" };
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      error: "kind must be locked_in, summary, test_me, or carded",
    };
  }

  return { ok: true, kind: parsed.data.kind ?? "locked_in" };
}

export function missingUpstreamMessage(kind: GenerateKind): string {
  if (kind === "summary" || kind === "test_me") {
    return "Generate Locked In first.";
  }
  if (kind === "carded") {
    return "Generate Summary first.";
  }
  return "No ingested sources to generate from. Video and audio are not processed in v1.";
}
