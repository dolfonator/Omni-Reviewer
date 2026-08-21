import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  generateCarded,
  generateStudyPack,
  generateSummary,
  generateTestMe,
  StudyPackJsonError,
} from "@/lib/ai";
import { db } from "@/lib/db";
import {
  missingUpstreamMessage,
  parseGenerateBody,
  type GenerateKind,
} from "@/lib/generate-request";
import { reviewers, sources, views } from "@/lib/schema";
import {
  viewsPayloadFromRows,
  type ViewsPayload,
} from "@/lib/serialize-view";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ViewKind = GenerateKind;

async function readPayload(reviewerId: string): Promise<ViewsPayload> {
  const rows = await db
    .select()
    .from(views)
    .where(eq(views.reviewerId, reviewerId));
  return viewsPayloadFromRows(rows);
}

async function upsertView(args: {
  reviewerId: string;
  kind: ViewKind;
  content: string;
  contentJson: unknown | null;
  generatedAt: Date;
}) {
  const [row] = await db
    .insert(views)
    .values({
      reviewerId: args.reviewerId,
      kind: args.kind,
      content: args.content,
      contentJson: args.contentJson,
      generatedAt: args.generatedAt,
    })
    .onConflictDoUpdate({
      target: [views.reviewerId, views.kind],
      set: {
        content: args.content,
        contentJson: args.contentJson,
        generatedAt: args.generatedAt,
      },
    })
    .returning();

  return row;
}

async function loadExtractedTexts(reviewerId: string) {
  const allSources = await db
    .select()
    .from(sources)
    .where(
      and(
        eq(sources.reviewerId, reviewerId),
        eq(sources.ingestStatus, "ready"),
      ),
    );

  return allSources
    .filter(
      (s) =>
        typeof s.extractedText === "string" && s.extractedText.trim().length > 0,
    )
    .map((s) => ({
      filename: s.filename,
      text: s.extractedText as string,
    }));
}

async function stampReviewer(reviewerId: string, generatedAt: Date) {
  await db
    .update(reviewers)
    .set({ lastGeneratedAt: generatedAt })
    .where(eq(reviewers.id, reviewerId));
}

function jsonError(err: unknown) {
  if (err instanceof StudyPackJsonError) {
    return NextResponse.json(
      { error: err.message, kind: err.kind },
      { status: 502 },
    );
  }
  const message = err instanceof Error ? err.message : "Generation failed";
  return NextResponse.json({ error: message }, { status: 502 });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: reviewerId } = await context.params;

  const rawBody = await request.text();
  const parsed = parseGenerateBody(rawBody);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const kind = parsed.kind;

  const [reviewer] = await db
    .select()
    .from(reviewers)
    .where(eq(reviewers.id, reviewerId))
    .limit(1);

  if (!reviewer) {
    return NextResponse.json({ error: "Reviewer not found" }, { status: 404 });
  }

  const generatedAt = new Date();

  try {
    if (kind === "locked_in") {
      const extractedTexts = await loadExtractedTexts(reviewerId);
      if (extractedTexts.length === 0) {
        return NextResponse.json(
          { error: missingUpstreamMessage("locked_in") },
          { status: 400 },
        );
      }

      const pack = await generateStudyPack({ extractedTexts });

      await upsertView({
        reviewerId,
        kind: "locked_in",
        content: pack.lockedIn,
        contentJson: null,
        generatedAt,
      });
      await upsertView({
        reviewerId,
        kind: "summary",
        content: pack.summary,
        contentJson: null,
        generatedAt,
      });
      await upsertView({
        reviewerId,
        kind: "test_me",
        content: JSON.stringify(pack.testMe),
        contentJson: pack.testMe,
        generatedAt,
      });
      await upsertView({
        reviewerId,
        kind: "carded",
        content: JSON.stringify(pack.carded),
        contentJson: pack.carded,
        generatedAt,
      });
    } else {
      const existing = await readPayload(reviewerId);

      if (kind === "summary" || kind === "test_me") {
        const lockedIn = existing.locked_in?.content?.trim() ?? "";
        if (!lockedIn) {
          return NextResponse.json(
            { error: missingUpstreamMessage(kind) },
            { status: 400 },
          );
        }

        if (kind === "summary") {
          const summary = await generateSummary(lockedIn);
          await upsertView({
            reviewerId,
            kind: "summary",
            content: summary,
            contentJson: null,
            generatedAt,
          });
        } else {
          const testMe = await generateTestMe(lockedIn);
          await upsertView({
            reviewerId,
            kind: "test_me",
            content: JSON.stringify(testMe),
            contentJson: testMe,
            generatedAt,
          });
        }
      } else {
        const summary = existing.summary?.content?.trim() ?? "";
        if (!summary) {
          return NextResponse.json(
            { error: missingUpstreamMessage("carded") },
            { status: 400 },
          );
        }
        const carded = await generateCarded(summary);
        await upsertView({
          reviewerId,
          kind: "carded",
          content: JSON.stringify(carded),
          contentJson: carded,
          generatedAt,
        });
      }
    }
  } catch (err) {
    return jsonError(err);
  }

  await stampReviewer(reviewerId, generatedAt);
  return NextResponse.json(await readPayload(reviewerId));
}
