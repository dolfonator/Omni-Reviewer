/**
 * Shared test fixtures and response builders.
 * Callers that need module mocks should declare `vi.mock(...)` at their
 * own top level (Vitest hoists only top-level mock calls).
 */

/** Build a fetch Response that yields the given body as ArrayBuffer bytes. */
export function blobFetchResponse(
  body: string | Uint8Array,
  init: { ok?: boolean; status?: number; contentType?: string } = {},
): Response {
  const bytes =
    typeof body === "string" ? new TextEncoder().encode(body) : body;
  const status = init.status ?? (init.ok === false ? 500 : 200);
  const ok = init.ok ?? (status >= 200 && status < 300);
  const copy = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  );
  return {
    ok,
    status,
    arrayBuffer: async () => copy,
    headers: new Headers({
      "content-type": init.contentType ?? "application/octet-stream",
    }),
  } as Response;
}

export const SAMPLE_LOCKED_IN =
  "# Locked In\n\nPhotosynthesis converts light into chemical energy.";

export const SAMPLE_SUMMARY =
  "# Summary\n\n- Light → chemical energy via photosynthesis.";

export const SAMPLE_TEST_ME_JSON = JSON.stringify([
  {
    id: "q1",
    question: "What does photosynthesis convert?",
    choices: ["Light", "Sound"],
    answer: "Light",
    explanation: "Converts light into chemical energy.",
  },
]);

export const SAMPLE_CARDED_JSON = JSON.stringify([
  {
    id: "c1",
    front: "Photosynthesis input",
    back: "Light energy",
  },
]);
