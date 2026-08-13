import { relations } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const sourceKindEnum = pgEnum("source_kind", [
  "pdf",
  "image",
  "text",
  "video",
  "audio",
]);

export const ingestStatusEnum = pgEnum("ingest_status", [
  "ready",
  "unprocessed",
  "failed",
]);

export const viewKindEnum = pgEnum("view_kind", [
  "locked_in",
  "summary",
  "test_me",
  "carded",
]);

export const topics = pgTable("topics", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const reviewers = pgTable("reviewers", {
  id: uuid("id").defaultRandom().primaryKey(),
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastGeneratedAt: timestamp("last_generated_at", { withTimezone: true }),
});

export const sources = pgTable("sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  reviewerId: uuid("reviewer_id")
    .notNull()
    .references(() => reviewers.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  mime: text("mime").notNull(),
  kind: sourceKindEnum("kind").notNull(),
  blobUrl: text("blob_url").notNull(),
  blobPathname: text("blob_pathname").notNull(),
  ingestStatus: ingestStatusEnum("ingest_status").notNull(),
  extractedText: text("extracted_text"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const views = pgTable(
  "views",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reviewerId: uuid("reviewer_id")
      .notNull()
      .references(() => reviewers.id, { onDelete: "cascade" }),
    kind: viewKindEnum("kind").notNull(),
    content: text("content").notNull().default(""),
    contentJson: jsonb("content_json"),
    generatedAt: timestamp("generated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique("views_reviewer_id_kind_unique").on(table.reviewerId, table.kind)],
);

export const topicsRelations = relations(topics, ({ many }) => ({
  reviewers: many(reviewers),
}));

export const reviewersRelations = relations(reviewers, ({ one, many }) => ({
  topic: one(topics, {
    fields: [reviewers.topicId],
    references: [topics.id],
  }),
  sources: many(sources),
  views: many(views),
}));

export const sourcesRelations = relations(sources, ({ one }) => ({
  reviewer: one(reviewers, {
    fields: [sources.reviewerId],
    references: [reviewers.id],
  }),
}));

export const viewsRelations = relations(views, ({ one }) => ({
  reviewer: one(reviewers, {
    fields: [views.reviewerId],
    references: [reviewers.id],
  }),
}));

export type Topic = typeof topics.$inferSelect;
export type NewTopic = typeof topics.$inferInsert;
export type Reviewer = typeof reviewers.$inferSelect;
export type NewReviewer = typeof reviewers.$inferInsert;
export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;
export type StudyView = typeof views.$inferSelect;
export type NewStudyView = typeof views.$inferInsert;
