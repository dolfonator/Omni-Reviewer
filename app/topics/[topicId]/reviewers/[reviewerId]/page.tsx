import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import type { ViewsPayload } from "@/components/generate-button";
import { ReviewerWorkspace } from "@/components/reviewer-workspace";
import type { SourceListItem } from "@/components/source-panel";
import {
  getReviewer,
  getTopic,
  listSourcesForUi,
  listViewMetaByReviewer,
} from "@/lib/queries";
import type { IngestStatus, SourceKind } from "@/lib/types";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ topicId: string; reviewerId: string }>;
};

export default async function ReviewerPage({ params }: PageProps) {
  const { topicId, reviewerId } = await params;

  const [topic, reviewer] = await Promise.all([
    getTopic(topicId),
    getReviewer(reviewerId),
  ]);
  if (!topic) notFound();
  if (!reviewer || reviewer.topicId !== topicId) notFound();

  const [sourceRows, viewMeta] = await Promise.all([
    listSourcesForUi(reviewerId),
    listViewMetaByReviewer(reviewerId),
  ]);
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

  const initialViews: ViewsPayload = {
    locked_in: null,
    summary: null,
    test_me: null,
    carded: null,
  };

  for (const row of viewMeta) {
    const placeholder = {
      id: row.id,
      reviewerId: row.reviewerId,
      kind: row.kind,
      content: "",
      contentJson: null,
      generatedAt: row.generatedAt.toISOString(),
    };
    if (row.kind === "locked_in") initialViews.locked_in = placeholder;
    else if (row.kind === "summary") initialViews.summary = placeholder;
    else if (row.kind === "test_me") initialViews.test_me = placeholder;
    else if (row.kind === "carded") initialViews.carded = placeholder;
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
