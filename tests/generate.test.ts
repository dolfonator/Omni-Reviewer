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

vi.mock("@ai-sdk/xai", () => ({
  createXai: () => {
    return (modelId: string) => ({ modelId });
  },
}));

import { generateStudyPack, generateTextFromPrompt } from "@/lib/ai";
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
    process.env.XAI_API_KEY = "test-key-not-real";
    process.env.AI_MODEL = "grok-4.6";
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
});
