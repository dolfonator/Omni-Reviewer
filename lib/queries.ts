import "server-only";

import { and, asc, eq, max } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  reviewers,
  sources,
  topics,
  views,
  type NewSource,
  type Source,
} from "@/lib/schema";

export async function listTopics() {
  return db
    .select()
    .from(topics)
    .orderBy(asc(topics.sortOrder), asc(topics.createdAt));
}

export async function getTopic(id: string) {
  const [row] = await db
    .select()
    .from(topics)
    .where(eq(topics.id, id))
    .limit(1);
  return row ?? null;
}

export async function createTopic(name: string) {
  const [agg] = await db.select({ maxOrder: max(topics.sortOrder) }).from(topics);
  const sortOrder = (agg?.maxOrder ?? -1) + 1;
  const [row] = await db
    .insert(topics)
    .values({ name, sortOrder })
    .returning();
  return row;
}

export async function renameTopic(id: string, name: string) {
  const [row] = await db
    .update(topics)
    .set({ name })
    .where(eq(topics.id, id))
    .returning();
  return row ?? null;
}

/** Cascade deletes reviewers/sources/views via FK. */
export async function deleteTopic(id: string) {
  const [row] = await db
    .delete(topics)
    .where(eq(topics.id, id))
    .returning();
  return row ?? null;
}

export async function listReviewersByTopic(topicId: string) {
  return db
    .select()
    .from(reviewers)
    .where(eq(reviewers.topicId, topicId))
    .orderBy(asc(reviewers.createdAt));
}

export async function getReviewer(id: string) {
  const [row] = await db
    .select()
    .from(reviewers)
    .where(eq(reviewers.id, id))
    .limit(1);
  return row ?? null;
}

export async function createReviewer(topicId: string, name: string) {
  const [row] = await db
    .insert(reviewers)
    .values({ topicId, name })
    .returning();
  return row;
}

export async function renameReviewer(id: string, name: string) {
  const [row] = await db
    .update(reviewers)
    .set({ name })
    .where(eq(reviewers.id, id))
    .returning();
  return row ?? null;
}

/** Cascade deletes sources/views via FK. */
export async function deleteReviewer(id: string) {
  const [row] = await db
    .delete(reviewers)
    .where(eq(reviewers.id, id))
    .returning();
  return row ?? null;
}

export async function listSourcesByReviewer(reviewerId: string) {
  return db
    .select()
    .from(sources)
    .where(eq(sources.reviewerId, reviewerId))
    .orderBy(asc(sources.createdAt));
}

/** Source rows for UI/list APIs. Omits lecture-sized extractedText. */
export async function listSourcesForUi(reviewerId: string) {
  return db
    .select({
      id: sources.id,
      reviewerId: sources.reviewerId,
      filename: sources.filename,
      mime: sources.mime,
      kind: sources.kind,
      blobUrl: sources.blobUrl,
      blobPathname: sources.blobPathname,
      ingestStatus: sources.ingestStatus,
      errorMessage: sources.errorMessage,
      createdAt: sources.createdAt,
    })
    .from(sources)
    .where(eq(sources.reviewerId, reviewerId))
    .orderBy(asc(sources.createdAt));
}

/** View identity and timestamps only. No markdown/JSON bodies. */
export async function listViewMetaByReviewer(reviewerId: string) {
  return db
    .select({
      id: views.id,
      reviewerId: views.reviewerId,
      kind: views.kind,
      generatedAt: views.generatedAt,
    })
    .from(views)
    .where(eq(views.reviewerId, reviewerId));
}

export async function getSource(id: string) {
  const [row] = await db
    .select()
    .from(sources)
    .where(eq(sources.id, id))
    .limit(1);
  return row ?? null;
}

export async function getSourceForReviewer(reviewerId: string, sourceId: string) {
  const [row] = await db
    .select()
    .from(sources)
    .where(and(eq(sources.id, sourceId), eq(sources.reviewerId, reviewerId)))
    .limit(1);
  return row ?? null;
}

export async function createSource(
  values: Omit<NewSource, "id" | "createdAt"> &
    Partial<Pick<NewSource, "id" | "createdAt">>,
): Promise<Source> {
  const [row] = await db.insert(sources).values(values).returning();
  return row;
}

export async function deleteSource(id: string) {
  const [row] = await db
    .delete(sources)
    .where(eq(sources.id, id))
    .returning();
  return row ?? null;
}
