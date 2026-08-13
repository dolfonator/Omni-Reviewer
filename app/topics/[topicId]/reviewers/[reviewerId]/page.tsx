import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

import { AppShell } from "@/components/app-shell";
import type { ViewsPayload } from "@/components/generate-button";
import { ReviewerWorkspace } from "@/components/reviewer-workspace";
import type { SourceListItem } from "@/components/source-panel";
import { db } from "@/lib/db";
import {
  getReviewer,
  getTopic,
  listSourcesByReviewer,
} from "@/lib/queries";
import { views } from "@/lib/schema";
import type { IngestStatus, SourceKind } from "@/lib/types";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ topicId: string; reviewerId: string }>;
};

export default async function ReviewerPage({ params }: PageProps) {
  const { topicId, reviewerId } = await params;

  const topic = await getTopic(topicId);
  if (!topic) notFound();

  const reviewer = await getReviewer(reviewerId);
  if (!reviewer || reviewer.topicId !== topicId) notFound();

  const sourceRows = await listSourcesByReviewer(reviewerId);
  const initialSources: SourceListItem[] = sourceRows.map((s) => ({
    id: s.id,
    reviewerId: s.reviewerId,
    filename: s.filename,
    mime: s.mime,
    kind: s.kind as SourceKind,
    blobUrl: s.blobUrl,
    blobPathname: s.blobPathname,
    ingestStatus: s.ingestStatus as IngestStatus,
    errorMessage: s.errorMessage,
    createdAt: s.createdAt.toISOString(),
  }));

  const viewRows = await db
    .select()
    .from(views)
    .where(eq(views.reviewerId, reviewerId));

  const initialViews: ViewsPayload = {
    locked_in: null,
    summary: null,
    test_me: null,
    carded: null,
  };

  for (const row of viewRows) {
    const serialized = {
      id: row.id,
      reviewerId: row.reviewerId,
      kind: row.kind,
      content: row.content,
      contentJson: row.contentJson ?? null,
      generatedAt: row.generatedAt.toISOString(),
    };
    if (row.kind === "locked_in") initialViews.locked_in = serialized;
    else if (row.kind === "summary") initialViews.summary = serialized;
    else if (row.kind === "test_me") initialViews.test_me = serialized;
    else if (row.kind === "carded") initialViews.carded = serialized;
  }

  return (
    <AppShell>
      <ReviewerWorkspace
        topicId={topic.id}
        topicName={topic.name}
        reviewerId={reviewer.id}
        reviewerName={reviewer.name}
        initialSources={initialSources}
        initialViews={initialViews}
        lastGeneratedAt={
          reviewer.lastGeneratedAt
            ? reviewer.lastGeneratedAt.toISOString()
            : null
        }
      />
    </AppShell>
  );
}
