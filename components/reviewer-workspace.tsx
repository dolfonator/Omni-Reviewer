"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import {
  GenerateButton,
  type ViewsPayload,
} from "@/components/generate-button";
import {
  SourcePanel,
  type SourceListItem,
} from "@/components/source-panel";
import { ViewTabs } from "@/components/view-tabs";
import { Separator } from "@/components/ui/separator";

type ReviewerWorkspaceProps = {
  topicId: string;
  topicName: string;
  reviewerId: string;
  reviewerName: string;
  initialSources: SourceListItem[];
  initialViews: ViewsPayload;
  lastGeneratedAt: string | null;
};

export function ReviewerWorkspace({
  topicId,
  topicName,
  reviewerId,
  reviewerName,
  initialSources,
  initialViews,
  lastGeneratedAt,
}: ReviewerWorkspaceProps) {
  const [sources, setSources] = useState(initialSources);
  const [views, setViews] = useState(initialViews);
  const [generatedAt, setGeneratedAt] = useState(lastGeneratedAt);

  const hasReadySource = useMemo(
    () => sources.some((s) => s.ingestStatus === "ready"),
    [sources],
  );

  const hasViews = useMemo(
    () =>
      Boolean(
        views.locked_in || views.summary || views.test_me || views.carded,
      ),
    [views],
  );

  const sourcesAreMediaOnly = useMemo(() => {
    if (sources.length === 0) return false;
    return sources.every(
      (s) => s.kind === "video" || s.kind === "audio" || s.ingestStatus === "unprocessed",
    );
  }, [sources]);

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-1">
        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <Link
            href={`/?topic=${topicId}`}
            className="rounded outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            {topicName}
          </Link>
          <span aria-hidden>/</span>
          <span className="text-foreground">{reviewerName}</span>
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
          {reviewerName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {generatedAt
            ? `Last generated ${new Date(generatedAt).toLocaleString()}`
            : "Not generated yet. Upload Ready sources, then generate."}
        </p>
      </div>

      <SourcePanel
        reviewerId={reviewerId}
        initialSources={initialSources}
        onSourcesChange={setSources}
      />

      <section className="space-y-3" aria-labelledby="generate-heading">
        <div>
          <h2
            id="generate-heading"
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            Study pack
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Generation writes all four views at once and keeps them until you
            regenerate.
          </p>
        </div>
        <GenerateButton
          reviewerId={reviewerId}
          hasReadySource={hasReadySource}
          hasViews={hasViews}
          sourcesAreMediaOnly={sourcesAreMediaOnly}
          onGenerated={(next) => {
            setViews(next);
            const stamp =
              next.locked_in?.generatedAt ??
              next.summary?.generatedAt ??
              next.test_me?.generatedAt ??
              next.carded?.generatedAt ??
              new Date().toISOString();
            setGeneratedAt(stamp);
          }}
        />
      </section>

      <Separator />

      <section className="space-y-3" aria-labelledby="views-heading">
        <h2
          id="views-heading"
          className="text-sm font-semibold tracking-tight text-foreground"
        >
          Views
        </h2>
        <ViewTabs views={views} />
      </section>
    </div>
  );
}
