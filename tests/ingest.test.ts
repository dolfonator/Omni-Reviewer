import { readFileSync } from "node:fs";
import path from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { blobFetchResponse } from "./helpers";

vi.mock("server-only", () => ({}));

vi.mock("@vercel/blob", () => ({
  del: vi.fn(),
  put: vi.fn(),
}));

vi.mock("@vercel/blob/client", () => ({
  handleUpload: vi.fn(),
}));

const visionReadImages = vi.fn();

vi.mock("@/lib/ai", () => ({
  visionReadImages: (...args: unknown[]) => visionReadImages(...args),
  generateTextFromPrompt: vi.fn(),
  generateStudyPack: vi.fn(),
}));

const getDocumentProxy = vi.fn();
const extractText = vi.fn();

vi.mock("unpdf", () => ({
  getDocumentProxy: (...args: unknown[]) => getDocumentProxy(...args),
  extractText: (...args: unknown[]) => extractText(...args),
}));

import { ingestSource } from "@/lib/ingest";

const root = path.resolve(__dirname, "..");

describe("ingest", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    visionReadImages.mockReset();
    getDocumentProxy.mockReset();
    extractText.mockReset();
  });

  it("ingests a .txt body as ready with extracted_text", async () => {
    const body = "Lecture notes: mitochondria are the powerhouse.";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(blobFetchResponse(body, { contentType: "text/plain" })),
    );

    const result = await ingestSource({
      mime: "text/plain",
      blobUrl: "https://blob.example/notes.txt",
      filename: "notes.txt",
    });

    expect(result).toEqual({
      kind: "text",
      ingestStatus: "ready",
      extractedText: body,
      errorMessage: null,
    });
    expect(fetch).toHaveBeenCalledWith("https://blob.example/notes.txt");
  });

  it("marks video mime as unprocessed with null text", async () => {
    const result = await ingestSource({
      mime: "video/mp4",
      blobUrl: "https://blob.example/lecture.mp4",
      filename: "lecture.mp4",
    });

    expect(result).toEqual({
      kind: "video",
      ingestStatus: "unprocessed",
      extractedText: null,
      errorMessage: null,
    });
    expect(visionReadImages).not.toHaveBeenCalled();
  });

  it("marks audio mime as unprocessed with null text", async () => {
    const result = await ingestSource({
      mime: "audio/mpeg",
      blobUrl: "https://blob.example/lecture.mp3",
      filename: "lecture.mp3",
    });

    expect(result).toEqual({
      kind: "audio",
      ingestStatus: "unprocessed",
      extractedText: null,
      errorMessage: null,
    });
    expect(visionReadImages).not.toHaveBeenCalled();
  });

  it("routes images through visionReadImages and returns ready text", async () => {
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        blobFetchResponse(pngBytes, { contentType: "image/png" }),
      ),
    );
    visionReadImages.mockResolvedValue("Diagram: cell membrane structure");

    const result = await ingestSource({
      mime: "image/png",
      blobUrl: "https://blob.example/diagram.png",
      filename: "diagram.png",
    });

    expect(visionReadImages).toHaveBeenCalledTimes(1);
    expect(visionReadImages).toHaveBeenCalledWith(
      [{ mime: "image/png", bytes: expect.any(Uint8Array) }],
      expect.stringMatching(/transcribe|text|image/i),
    );
    expect(result).toEqual({
      kind: "image",
      ingestStatus: "ready",
      extractedText: "Diagram: cell membrane structure",
      errorMessage: null,
    });
  });

  it("fails textless PDFs that cannot be rasterized without canvas", async () => {
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        blobFetchResponse(pdfBytes, { contentType: "application/pdf" }),
      ),
    );
    getDocumentProxy.mockResolvedValue({ pages: 1 });
    extractText.mockResolvedValue({ text: "   " });

    const result = await ingestSource({
      mime: "application/pdf",
      blobUrl: "https://blob.example/scan.pdf",
      filename: "scan.pdf",
    });

    expect(result.kind).toBe("pdf");
    expect(result.ingestStatus).toBe("failed");
    expect(result.errorMessage).toBeTruthy();
    expect(result.errorMessage).toMatch(/no extractable text|cannot be rasterized/i);
    expect(visionReadImages).not.toHaveBeenCalled();
  });

  it("does not import canvas or @napi-rs/canvas for PDF rasterization", () => {
    const source = readFileSync(path.join(root, "lib/ingest.ts"), "utf8");
    // Comments may mention the forbidden packages; only real imports fail.
    expect(source).not.toMatch(
      /(?:import|require)\s*(?:\{[^}]*\}\s*from\s*)?["']@napi-rs\/canvas["']/,
    );
    expect(source).not.toMatch(
      /(?:import|require)\s*(?:\{[^}]*\}\s*from\s*)?["']canvas["']/,
    );
    expect(source).not.toMatch(
      /from\s+["'](?:canvas|@napi-rs\/canvas)["']/,
    );
  });

  it("wires visionReadImages for the image path in source", () => {
    const source = readFileSync(path.join(root, "lib/ingest.ts"), "utf8");
    expect(source).toContain("visionReadImages");
    expect(source).toMatch(/kind === ["']image["']/);
  });
});
