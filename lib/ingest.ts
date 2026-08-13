import "server-only";

import { extractText, getDocumentProxy } from "unpdf";

import { visionReadImages } from "@/lib/ai";
import { kindFromMime, normalizeMime } from "@/lib/blob";
import type { IngestStatus, SourceKind } from "@/lib/types";

/** Below this length, PDF text is treated as empty/tiny (likely scanned). */
const MIN_MEANINGFUL_PDF_TEXT = 40;

const IMAGE_VISION_INSTRUCTION =
  "Read and transcribe all text visible in this image for study notes. " +
  "Preserve structure, headings, lists, equations, and labels. " +
  "If there is little text, describe the educational content clearly.";

export type IngestResult = {
  kind: SourceKind;
  ingestStatus: IngestStatus;
  extractedText: string | null;
  errorMessage: string | null;
};

async function downloadBlobBytes(blobUrl: string): Promise<Uint8Array> {
  const res = await fetch(blobUrl);
  if (!res.ok) {
    throw new Error(`Failed to download blob (${res.status})`);
  }
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
}

async function ingestText(blobUrl: string): Promise<IngestResult> {
  const bytes = await downloadBlobBytes(blobUrl);
  const extractedText = new TextDecoder("utf-8").decode(bytes);
  return {
    kind: "text",
    ingestStatus: "ready",
    extractedText,
    errorMessage: null,
  };
}

async function ingestImage(
  blobUrl: string,
  mime: string,
): Promise<IngestResult> {
  try {
    const bytes = await downloadBlobBytes(blobUrl);
    const mediaType = normalizeMime(mime);
    const extractedText = await visionReadImages(
      [{ mime: mediaType, bytes }],
      IMAGE_VISION_INSTRUCTION,
    );
    if (!extractedText.trim()) {
      return {
        kind: "image",
        ingestStatus: "failed",
        extractedText: null,
        errorMessage: "Vision readout returned empty text",
      };
    }
    return {
      kind: "image",
      ingestStatus: "ready",
      extractedText,
      errorMessage: null,
    };
  } catch (err) {
    return {
      kind: "image",
      ingestStatus: "failed",
      extractedText: null,
      errorMessage: errorMessage(err, "Image vision readout failed"),
    };
  }
}

/**
 * PDF path: unpdf text extract only.
 * Page rasterization requires @napi-rs/canvas (or similar), which is not
 * installed and must not be added — textless PDFs fail with a clear message.
 * If unpdf later yields already-encoded page images without a native canvas,
 * they can be passed to visionReadImages here.
 */
async function ingestPdf(blobUrl: string): Promise<IngestResult> {
  try {
    const bytes = await downloadBlobBytes(blobUrl);
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });
    const merged = typeof text === "string" ? text : String(text ?? "");
    const cleaned = merged.replace(/\u0000/g, "").trim();

    if (cleaned.length >= MIN_MEANINGFUL_PDF_TEXT) {
      return {
        kind: "pdf",
        ingestStatus: "ready",
        extractedText: cleaned,
        errorMessage: null,
      };
    }

    // No canvas / @napi-rs/canvas in v1 — cannot rasterize pages for vision.
    return {
      kind: "pdf",
      ingestStatus: "failed",
      extractedText: cleaned.length > 0 ? cleaned : null,
      errorMessage:
        "PDF has no extractable text and cannot be rasterized in v1",
    };
  } catch (err) {
    return {
      kind: "pdf",
      ingestStatus: "failed",
      extractedText: null,
      errorMessage: errorMessage(err, "PDF text extraction failed"),
    };
  }
}

/**
 * Classify mime → kind and populate extracted_text / ingest_status.
 * Video and audio are never transcribed (remain unprocessed).
 */
export async function ingestSource(args: {
  mime: string;
  blobUrl: string;
  filename?: string;
}): Promise<IngestResult> {
  const kind = kindFromMime(args.mime);
  if (!kind) {
    return {
      kind: "text",
      ingestStatus: "failed",
      extractedText: null,
      errorMessage: `Unsupported mime type: ${args.mime}`,
    };
  }

  if (kind === "video" || kind === "audio") {
    return {
      kind,
      ingestStatus: "unprocessed",
      extractedText: null,
      errorMessage: null,
    };
  }

  if (kind === "text") {
    return ingestText(args.blobUrl);
  }

  if (kind === "image") {
    return ingestImage(args.blobUrl, args.mime);
  }

  return ingestPdf(args.blobUrl);
}
