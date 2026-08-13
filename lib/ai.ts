import "server-only";

import { createGoogle } from "@ai-sdk/google";
import { generateText } from "ai";

import {
  cardedPrompt,
  lockedInPrompt,
  repairJsonPrompt,
  summaryPrompt,
  testMePrompt,
} from "@/lib/prompts";

/** Thrown when structured JSON from the model cannot be parsed after one repair attempt. */
export class StudyPackJsonError extends Error {
  readonly kind: "test_me" | "carded";
  readonly raw: string;

  constructor(kind: "test_me" | "carded", message: string, raw: string) {
    super(message);
    this.name = "StudyPackJsonError";
    this.kind = kind;
    this.raw = raw;
  }
}

export function getModelId(): string {
  return process.env.AI_MODEL || "gemini-3.7-flash";
}

// Unpaid Gemini Developer API traffic (prompts, files, outputs) may be used to improve Google products.
function getGoogle() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return createGoogle({ apiKey });
}

function getModel() {
  return getGoogle()(getModelId());
}

export async function generateTextFromPrompt(prompt: string): Promise<string> {
  const { text } = await generateText({
    model: getModel(),
    prompt,
  });
  return text.trim();
}

export async function visionReadImages(
  images: { mime: string; bytes: Uint8Array }[],
  instruction: string,
): Promise<string> {
  if (images.length === 0) {
    throw new Error("visionReadImages requires at least one image");
  }

  const { text } = await generateText({
    model: getModel(),
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: instruction },
          ...images.map((img) => ({
            type: "image" as const,
            image: img.bytes,
            mediaType: img.mime,
          })),
        ],
      },
    ],
  });

  return text.trim();
}

function stripJsonFences(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/i);
  if (fenced?.[1]) return fenced[1].trim();

  // Model sometimes adds prose around a JSON array — extract outermost array.
  const start = trimmed.indexOf("[");
  const end = trimmed.lastIndexOf("]");
  if (start !== -1 && end > start) {
    return trimmed.slice(start, end + 1);
  }
  return trimmed;
}

function parseJsonArray(raw: string): unknown[] {
  const cleaned = stripJsonFences(raw);
  const parsed: unknown = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) {
    throw new SyntaxError("Expected a JSON array");
  }
  return parsed;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function validateTestMeItems(items: unknown[]): void {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      throw new SyntaxError(`test_me[${i}] must be an object`);
    }
    const obj = item as Record<string, unknown>;
    if (typeof obj.id !== "string") {
      throw new SyntaxError(`test_me[${i}].id must be a string`);
    }
    if (typeof obj.question !== "string") {
      throw new SyntaxError(`test_me[${i}].question must be a string`);
    }
    if (typeof obj.answer !== "string") {
      throw new SyntaxError(`test_me[${i}].answer must be a string`);
    }
    if (typeof obj.explanation !== "string") {
      throw new SyntaxError(`test_me[${i}].explanation must be a string`);
    }
    if (obj.choices !== undefined && !isStringArray(obj.choices)) {
      throw new SyntaxError(`test_me[${i}].choices must be a string[] when present`);
    }
  }
}

function validateCardedItems(items: unknown[]): void {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      throw new SyntaxError(`carded[${i}] must be an object`);
    }
    const obj = item as Record<string, unknown>;
    if (typeof obj.id !== "string") {
      throw new SyntaxError(`carded[${i}].id must be a string`);
    }
    if (typeof obj.front !== "string") {
      throw new SyntaxError(`carded[${i}].front must be a string`);
    }
    if (typeof obj.back !== "string") {
      throw new SyntaxError(`carded[${i}].back must be a string`);
    }
  }
}

function parseAndValidateArray(
  kind: "test_me" | "carded",
  raw: string,
): unknown[] {
  const items = parseJsonArray(raw);
  if (kind === "test_me") {
    validateTestMeItems(items);
  } else {
    validateCardedItems(items);
  }
  return items;
}

async function parseJsonWithRepair(
  kind: "test_me" | "carded",
  raw: string,
): Promise<unknown> {
  try {
    return parseAndValidateArray(kind, raw);
  } catch (firstError) {
    const repaired = await generateTextFromPrompt(repairJsonPrompt(kind, raw));
    try {
      return parseAndValidateArray(kind, repaired);
    } catch (secondError) {
      const detail =
        secondError instanceof Error
          ? secondError.message
          : firstError instanceof Error
            ? firstError.message
            : "unknown parse error";
      throw new StudyPackJsonError(
        kind,
        `Failed to parse ${kind} JSON after repair: ${detail}`,
        repaired,
      );
    }
  }
}

/**
 * Sequential study-pack pipeline:
 * Locked In (sources) → Summary (Locked In) → Test Me (Locked In) → Carded (Summary).
 */
export async function generateStudyPack(input: {
  extractedTexts: { filename: string; text: string }[];
}): Promise<{
  lockedIn: string;
  summary: string;
  testMe: unknown;
  carded: unknown;
}> {
  if (input.extractedTexts.length === 0) {
    throw new Error("generateStudyPack requires at least one extracted text");
  }

  const lockedIn = await generateTextFromPrompt(
    lockedInPrompt(input.extractedTexts),
  );

  const summary = await generateTextFromPrompt(summaryPrompt(lockedIn));

  const testMeRaw = await generateTextFromPrompt(testMePrompt(lockedIn));
  const testMe = await parseJsonWithRepair("test_me", testMeRaw);

  const cardedRaw = await generateTextFromPrompt(cardedPrompt(summary));
  const carded = await parseJsonWithRepair("carded", cardedRaw);

  return { lockedIn, summary, testMe, carded };
}
