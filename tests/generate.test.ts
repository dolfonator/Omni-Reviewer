import { readFileSync } from "node:fs";
import path from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  SAMPLE_CARDED_JSON,
  SAMPLE_LOCKED_IN,
  SAMPLE_SUMMARY,
  SAMPLE_TEST_ME_JSON,
} from "./helpers";

vi.mock("server-only", () => ({}));

/** Mock of generateTextFromPrompt's underlying AI SDK call. */
const generateText = vi.hoisted(() => vi.fn());

vi.mock("ai", () => ({
  generateText: (...args: unknown[]) => generateText(...args),
}));

vi.mock("@ai-sdk/google", () => ({
  createGoogle: () => {
    return (modelId: string) => ({ modelId });
  },
}));

import {
  generateCarded,
  generateLockedIn,
  generateStudyPack,
  generateSummary,
  generateTestMe,
  generateTextFromPrompt,
} from "@/lib/ai";
import {
  cardedPrompt,
  lockedInPrompt,
  summaryPrompt,
  testMePrompt,
} from "@/lib/prompts";

const root = path.resolve(__dirname, "..");

describe("generate", () => {
  beforeEach(() => {
    generateText.mockReset();
    process.env.GEMINI_API_KEY = "test-key-not-real";
    process.env.AI_MODEL = "gemini-3.7-flash";
  });

  it("calls generateTextFromPrompt in order Locked In → Summary → Test Me → Carded", async () => {
    const rawMarker = "RAW_SOURCE_UNIQUE_TOKEN_xyz";
    const extractedTexts = [
      { filename: "notes.txt", text: `Intro lecture. ${rawMarker}` },
    ];

    // generateTextFromPrompt → generateText; mock the dependency.
    generateText
      .mockResolvedValueOnce({ text: SAMPLE_LOCKED_IN })
      .mockResolvedValueOnce({ text: SAMPLE_SUMMARY })
      .mockResolvedValueOnce({ text: SAMPLE_TEST_ME_JSON })
      .mockResolvedValueOnce({ text: SAMPLE_CARDED_JSON });

    expect(typeof generateTextFromPrompt).toBe("function");

    const pack = await generateStudyPack({ extractedTexts });

    expect(generateText).toHaveBeenCalledTimes(4);

    const prompts = generateText.mock.calls.map(
      (call) => (call[0] as { prompt: string }).prompt,
    );

    expect(prompts[0]).toBe(lockedInPrompt(extractedTexts));
    expect(prompts[1]).toBe(summaryPrompt(SAMPLE_LOCKED_IN));
    expect(prompts[2]).toBe(testMePrompt(SAMPLE_LOCKED_IN));
    expect(prompts[3]).toBe(cardedPrompt(SAMPLE_SUMMARY));

    // Summary is fed Locked In, not the raw sources.
    expect(prompts[1]).not.toContain(rawMarker);
    expect(prompts[1]).toContain(SAMPLE_LOCKED_IN);

    // Test Me also derives from Locked In only.
    expect(prompts[2]).not.toContain(rawMarker);
    expect(prompts[2]).toContain(SAMPLE_LOCKED_IN);

    // Carded derives from Summary only.
    expect(prompts[3]).not.toContain(rawMarker);
    expect(prompts[3]).toContain(SAMPLE_SUMMARY);
    expect(prompts[3]).not.toBe(cardedPrompt(SAMPLE_LOCKED_IN));

    expect(pack.lockedIn).toBe(SAMPLE_LOCKED_IN);
    expect(pack.summary).toBe(SAMPLE_SUMMARY);
    expect(pack.testMe).toEqual(JSON.parse(SAMPLE_TEST_ME_JSON));
    expect(pack.carded).toEqual(JSON.parse(SAMPLE_CARDED_JSON));
  });

  it("generateSummary prompt contains Locked In and not a unique raw-source marker", async () => {
    const rawMarker = "RAW_SOURCE_UNIQUE_TOKEN_xyz";
    generateText.mockResolvedValueOnce({ text: SAMPLE_SUMMARY });

    const summary = await generateSummary(SAMPLE_LOCKED_IN);

    expect(generateText).toHaveBeenCalledTimes(1);
    const prompt = (generateText.mock.calls[0][0] as { prompt: string }).prompt;
    expect(prompt).toBe(summaryPrompt(SAMPLE_LOCKED_IN));
    expect(prompt).toContain(SAMPLE_LOCKED_IN);
    expect(prompt).not.toContain(rawMarker);
    expect(summary).toBe(SAMPLE_SUMMARY);
  });

  it("generateTestMe prompt contains Locked In, not a unique raw-source marker, and returns a parsed array", async () => {
    const rawMarker = "RAW_SOURCE_UNIQUE_TOKEN_xyz";
    generateText.mockResolvedValueOnce({ text: SAMPLE_TEST_ME_JSON });

    const testMe = await generateTestMe(SAMPLE_LOCKED_IN);

    expect(generateText).toHaveBeenCalledTimes(1);
    const prompt = (generateText.mock.calls[0][0] as { prompt: string }).prompt;
    expect(prompt).toBe(testMePrompt(SAMPLE_LOCKED_IN));
    expect(prompt).toContain(SAMPLE_LOCKED_IN);
    expect(prompt).not.toContain(rawMarker);
    expect(Array.isArray(testMe)).toBe(true);
    expect(testMe).toEqual(JSON.parse(SAMPLE_TEST_ME_JSON));
  });

  it("generateCarded prompt contains Summary, not Locked In as the source document", async () => {
    generateText.mockResolvedValueOnce({ text: SAMPLE_CARDED_JSON });

    const carded = await generateCarded(SAMPLE_SUMMARY);

    expect(generateText).toHaveBeenCalledTimes(1);
    const prompt = (generateText.mock.calls[0][0] as { prompt: string }).prompt;
    expect(prompt).toBe(cardedPrompt(SAMPLE_SUMMARY));
    expect(prompt).toContain(SAMPLE_SUMMARY);
    expect(prompt).not.toBe(cardedPrompt(SAMPLE_LOCKED_IN));
    expect(prompt).not.toContain(SAMPLE_LOCKED_IN);
    expect(carded).toEqual(JSON.parse(SAMPLE_CARDED_JSON));
  });

  it("generateLockedIn prompt contains source text and not later-mode documents", async () => {
    const extractedTexts = [
      { filename: "notes.txt", text: "Intro lecture. RAW_SOURCE_UNIQUE_TOKEN_xyz" },
    ];
    generateText.mockResolvedValueOnce({ text: SAMPLE_LOCKED_IN });

    const lockedIn = await generateLockedIn(extractedTexts);

    expect(generateText).toHaveBeenCalledTimes(1);
    const prompt = (generateText.mock.calls[0][0] as { prompt: string }).prompt;
    expect(prompt).toBe(lockedInPrompt(extractedTexts));
    expect(prompt).toContain("RAW_SOURCE_UNIQUE_TOKEN_xyz");
    expect(lockedIn).toBe(SAMPLE_LOCKED_IN);
  });

  it("GET views route does not import generate at module scope", () => {
    const viewsRoute = readFileSync(
      path.join(root, "app/api/reviewers/[id]/views/route.ts"),
      "utf8",
    );

    expect(viewsRoute).not.toMatch(
      /import\s+.*generateStudyPack|from\s+["']@\/lib\/ai["']/,
    );
    expect(viewsRoute).not.toMatch(/generateTextFromPrompt|generateStudyPack/);
    expect(viewsRoute).toMatch(/export async function GET/);
  });

  it("POST generate route branches on kind and uses per-mode helpers", () => {
    const generateRoute = readFileSync(
      path.join(root, "app/api/reviewers/[id]/generate/route.ts"),
      "utf8",
    );

    expect(generateRoute).toMatch(/parseGenerateBody/);
    expect(generateRoute).toMatch(/missingUpstreamMessage/);
    expect(generateRoute).toMatch(/generateStudyPack/);
    expect(generateRoute).toMatch(/generateSummary/);
    expect(generateRoute).toMatch(/generateTestMe/);
    expect(generateRoute).toMatch(/generateCarded/);
  });

  it("GET sources route omits extractedText from the JSON payload", () => {
    const sourcesRoute = readFileSync(
      path.join(root, "app/api/reviewers/[id]/sources/route.ts"),
      "utf8",
    );

    expect(sourcesRoute).toMatch(/listSourcesForUi/);
    expect(sourcesRoute).not.toMatch(/extracted_text:\s*row/);
    expect(sourcesRoute).not.toMatch(/extractedText:\s*row\.extractedText/);
  });
});
