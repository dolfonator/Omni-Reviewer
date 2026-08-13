import { AppShell } from "@/components/app-shell";
import {
  ReviewerList,
  type ReviewerListItem,
} from "@/components/reviewer-list";
import { TopicTabs, type TopicListItem } from "@/components/topic-tabs";
import { listReviewersByTopic, listTopics } from "@/lib/queries";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams: Promise<{ topic?: string }>;
};

export default async function HomePage({ searchParams }: HomeProps) {
  const sp = await searchParams;
  const topics = await listTopics();

  const serializedTopics: TopicListItem[] = topics.map((t) => ({
    id: t.id,
    name: t.name,
    sortOrder: t.sortOrder,
    createdAt: t.createdAt.toISOString(),
  }));

  const selectedId =
    (sp.topic && topics.some((t) => t.id === sp.topic) ? sp.topic : null) ??
    topics[0]?.id ??
    null;

  const selectedTopic =
    topics.find((t) => t.id === selectedId) ?? null;

  const reviewers = selectedId
    ? await listReviewersByTopic(selectedId)
    : [];

  const serializedReviewers: ReviewerListItem[] = reviewers.map((r) => ({
    id: r.id,
    topicId: r.topicId,
    name: r.name,
    createdAt: r.createdAt.toISOString(),
    lastGeneratedAt: r.lastGeneratedAt
      ? r.lastGeneratedAt.toISOString()
      : null,
  }));

  return (
    <AppShell
      title="Study desk"
      subtitle="Pick a topic, open a study pack, attach sources, then generate when you are ready."
    >
      <div className="flex flex-col gap-8">
        <TopicTabs topics={serializedTopics} selectedId={selectedId} />
        <ReviewerList
          topicId={selectedId}
          topicName={selectedTopic?.name ?? null}
          reviewers={serializedReviewers}
        />
      </div>
    </AppShell>
  );
}
