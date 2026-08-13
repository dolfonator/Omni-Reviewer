/** Shared TypeScript types mirroring `lib/schema.ts`. */

export type SourceKind = "pdf" | "image" | "text" | "video" | "audio";

export type IngestStatus = "ready" | "unprocessed" | "failed";

export type ViewKind = "locked_in" | "summary" | "test_me" | "carded";

export type Topic = {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: Date;
};

export type Reviewer = {
  id: string;
  topicId: string;
  name: string;
  createdAt: Date;
  lastGeneratedAt: Date | null;
};

export type Source = {
  id: string;
  reviewerId: string;
  filename: string;
  mime: string;
  kind: SourceKind;
  blobUrl: string;
  blobPathname: string;
  ingestStatus: IngestStatus;
  extractedText: string | null;
  errorMessage: string | null;
  createdAt: Date;
};

export type StudyView = {
  id: string;
  reviewerId: string;
  kind: ViewKind;
  content: string;
  contentJson: unknown | null;
  generatedAt: Date;
};

export type TestMeItem = {
  id: string;
  question: string;
  choices?: string[];
  answer: string;
  explanation: string;
};

export type CardedItem = {
  id: string;
  front: string;
  back: string;
};
