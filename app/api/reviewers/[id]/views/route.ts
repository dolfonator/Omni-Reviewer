import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { views } from "@/lib/schema";

export const dynamic = "force-dynamic";

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

/**
 * Side-effect free: returns persisted views only. Does not call the model.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: reviewerId } = await context.params;

  const rows = await db
    .select()
    .from(views)
    .where(eq(views.reviewerId, reviewerId));

  const byKind = {
    locked_in: null as ReturnType<typeof serializeView> | null,
    summary: null as ReturnType<typeof serializeView> | null,
    test_me: null as ReturnType<typeof serializeView> | null,
    carded: null as ReturnType<typeof serializeView> | null,
  };

  for (const row of rows) {
    if (row.kind === "locked_in") byKind.locked_in = serializeView(row);
    else if (row.kind === "summary") byKind.summary = serializeView(row);
    else if (row.kind === "test_me") byKind.test_me = serializeView(row);
    else if (row.kind === "carded") byKind.carded = serializeView(row);
  }

  return NextResponse.json(byKind);
}
