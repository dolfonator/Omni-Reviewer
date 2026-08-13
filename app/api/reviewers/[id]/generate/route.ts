import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { generateStudyPack, StudyPackJsonError } from "@/lib/ai";
import { db } from "@/lib/db";
import { reviewers, sources, views } from "@/lib/schema";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ViewKind = "locked_in" | "summary" | "test_me" | "carded";

function serializeView(row: typeof views.$inferSelect) {
  return {
    id: row.id,
    reviewerId: row.reviewerId,
    kind: row.kind,
    content: row.content,
    contentJson: row.contentJson ?? null,
    generatedAt: row.generatedAt.toISOString(),
  };
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

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: reviewerId } = await context.params;

  const [reviewer] = await db
    .select()
    .from(reviewers)
    .where(eq(reviewers.id, reviewerId))
    .limit(1);

  if (!reviewer) {
    return NextResponse.json({ error: "Reviewer not found" }, { status: 404 });
  }

  const allSources = await db
    .select()
    .from(sources)
    .where(
      and(
        eq(sources.reviewerId, reviewerId),
        eq(sources.ingestStatus, "ready"),
      ),
    );

  const extractedTexts = allSources
    .filter(
      (s) =>
        typeof s.extractedText === "string" && s.extractedText.trim().length > 0,
    )
    .map((s) => ({
      filename: s.filename,
      text: s.extractedText as string,
    }));

  if (extractedTexts.length === 0) {
    return NextResponse.json(
      {
        error:
          "No ingested sources to generate from. Video and audio are not processed in v1.",
      },
      { status: 400 },
    );
  }

  let pack: Awaited<ReturnType<typeof generateStudyPack>>;
  try {
    pack = await generateStudyPack({ extractedTexts });
  } catch (err) {
    if (err instanceof StudyPackJsonError) {
      return NextResponse.json(
        { error: err.message, kind: err.kind },
        { status: 502 },
      );
    }
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const generatedAt = new Date();

  const lockedInRow = await upsertView({
    reviewerId,
    kind: "locked_in",
    content: pack.lockedIn,
    contentJson: null,
    generatedAt,
  });

  const summaryRow = await upsertView({
    reviewerId,
    kind: "summary",
    content: pack.summary,
    contentJson: null,
    generatedAt,
  });

  const testMeRow = await upsertView({
    reviewerId,
    kind: "test_me",
    content: JSON.stringify(pack.testMe),
    contentJson: pack.testMe,
    generatedAt,
  });

  const cardedRow = await upsertView({
    reviewerId,
    kind: "carded",
    content: JSON.stringify(pack.carded),
    contentJson: pack.carded,
    generatedAt,
  });

  await db
    .update(reviewers)
    .set({ lastGeneratedAt: generatedAt })
    .where(eq(reviewers.id, reviewerId));

  return NextResponse.json({
    locked_in: serializeView(lockedInRow),
    summary: serializeView(summaryRow),
    test_me: serializeView(testMeRow),
    carded: serializeView(cardedRow),
  });
}
