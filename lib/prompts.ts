/** Plain prompt strings for the study-pack generation pipeline. No secrets. */

export const NO_INVENT_CITATIONS =
  "Do not invent citations, quotes, page numbers, or facts the sources do not support. If something is unclear or missing, say so rather than guessing.";

export function lockedInPrompt(
  extractedTexts: { filename: string; text: string }[],
): string {
  const sourcesBlock = extractedTexts
    .map(
      (s, i) =>
        `### Source ${i + 1}: ${s.filename}\n\n${s.text.trim()}`,
    )
    .join("\n\n---\n\n");

  return `You are writing a comprehensive study document called "Locked In" from the extracted source materials below.

Requirements:
- Produce cohesive, long-form Markdown suitable for serious study.
- When the sources imply a chronological or sequential order (lectures, timelines, numbered modules, dated notes), organize the document chronologically.
- Otherwise organize by clear topic headings (## / ###).
- Merge overlapping content; resolve minor contradictions by preferring the most specific source and noting uncertainty briefly when needed.
- Be thorough: definitions, key claims, examples, formulas, procedures, and relationships between ideas.
- ${NO_INVENT_CITATIONS}
- Output Markdown only. No preamble or closing remarks outside the document.

# Source materials

${sourcesBlock}`;
}

export function summaryPrompt(lockedInMarkdown: string): string {
  return `You are writing a detailed "Summary" study document for last-minute review.

Requirements:
- Derive the summary **only** from the Locked In document below — not from external knowledge or other sources.
- Keep it detailed enough to review the full material, but denser and shorter than Locked In.
- Use clear Markdown with headings that mirror Locked In structure when helpful.
- Prefer bullets and tight paragraphs for scannability; preserve critical definitions, numbers, and distinctions.
- ${NO_INVENT_CITATIONS}
- Output Markdown only. No preamble or closing remarks.

# Locked In document

${lockedInMarkdown}`;
}

export function testMePrompt(lockedInMarkdown: string): string {
  return `You are creating a "Test Me" quiz from the Locked In study document below.

Requirements:
- Derive every question **only** from Locked In.
- Return a JSON array (no markdown fences, no commentary) of objects with this exact shape:
  {
    "id": string (stable short id, e.g. "q1"),
    "question": string,
    "choices": string[] (optional; include for multiple-choice items),
    "answer": string,
    "explanation": string
  }
- Mix question types when the material supports it (recall, comparison, application). Prefer multiple-choice when choices clarify discrimination; otherwise open-ended with a clear answer string is fine.
- Aim for enough items to meaningfully assess the material (typically 8–20, scale with content depth).
- ${NO_INVENT_CITATIONS}
- Output raw JSON only: a single array starting with [ and ending with ].

# Locked In document

${lockedInMarkdown}`;
}

export function cardedPrompt(summaryMarkdown: string): string {
  return `You are creating "Carded" flashcards from the Summary document below.

Requirements:
- Derive every card **only** from the Summary.
- Return a JSON array (no markdown fences, no commentary) of objects with this exact shape:
  {
    "id": string (stable short id, e.g. "c1"),
    "front": string (prompt / term / question),
    "back": string (answer / definition / explanation)
  }
- One atomic idea per card. Front should be answerable without seeing the back.
- Aim for enough cards to cover the Summary (typically 10–30, scale with content).
- ${NO_INVENT_CITATIONS}
- Output raw JSON only: a single array starting with [ and ending with ].

# Summary document

${summaryMarkdown}`;
}

export function repairJsonPrompt(
  kind: "test_me" | "carded",
  raw: string,
): string {
  const shape =
    kind === "test_me"
      ? `[{ "id": string, "question": string, "choices"?: string[], "answer": string, "explanation": string }]`
      : `[{ "id": string, "front": string, "back": string }]`;

  return `The following model output was supposed to be a JSON array of ${kind === "test_me" ? "quiz" : "flashcard"} items but failed to parse as JSON.

Repair it into valid JSON only:
- A single JSON array matching: ${shape}
- No markdown fences, no commentary, no trailing text.
- Keep the educational content; fix structure, quotes, commas, and truncated tails as needed.
- If the input is unusable, return the best possible minimal valid array (at least one item if any content is recoverable, else []).

# Broken output

${raw}`;
}
