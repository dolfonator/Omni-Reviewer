import { getTableName } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import {
  ingestStatusEnum,
  reviewers,
  sourceKindEnum,
  sources,
  topics,
  viewKindEnum,
  views,
} from "@/lib/schema";

describe("schema", () => {
  it("exports topics, reviewers, sources, and views tables", () => {
    expect(topics).toBeDefined();
    expect(reviewers).toBeDefined();
    expect(sources).toBeDefined();
    expect(views).toBeDefined();

    expect(getTableName(topics)).toBe("topics");
    expect(getTableName(reviewers)).toBe("reviewers");
    expect(getTableName(sources)).toBe("sources");
    expect(getTableName(views)).toBe("views");

    expect(topics.id).toBeDefined();
    expect(reviewers.topicId).toBeDefined();
    expect(sources.ingestStatus).toBeDefined();
    expect(views.kind).toBeDefined();
  });

  it("source kinds include pdf|image|text|video|audio", () => {
    expect(sourceKindEnum.enumValues).toEqual([
      "pdf",
      "image",
      "text",
      "video",
      "audio",
    ]);
  });

  it("view kinds include the four study views", () => {
    expect(viewKindEnum.enumValues).toEqual([
      "locked_in",
      "summary",
      "test_me",
      "carded",
    ]);
  });

  it("unprocessed is a valid ingest status", () => {
    expect(ingestStatusEnum.enumValues).toContain("unprocessed");
    expect(ingestStatusEnum.enumValues).toEqual([
      "ready",
      "unprocessed",
      "failed",
    ]);
  });
});
