"use client";

import { useState } from "react";
import { CircleNotch, Sparkle } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import type { ViewsPayload } from "@/lib/serialize-view";
import { readApiError } from "@/lib/utils";

export type { SerializedView, ViewsPayload } from "@/lib/serialize-view";

type GenerateButtonProps = {
  reviewerId: string;
  hasReadySource: boolean;
  hasViews: boolean;
  sourcesAreMediaOnly: boolean;
  onGenerated: (views: ViewsPayload) => void;
};

export function GenerateButton({
  reviewerId,
  hasReadySource,
  hasViews,
  sourcesAreMediaOnly,
  onGenerated,
}: GenerateButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (hasViews) return null;

  const disabled = busy || !hasReadySource;

  async function runGenerate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/reviewers/${reviewerId}/generate`, {
        method: "POST",
      });
      if (!res.ok) {
        setError(await readApiError(res));
        return;
      }
      const data = (await res.json()) as ViewsPayload;
      onGenerated(data);
    } catch {
      setError("Generation failed. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  function handleClick() {
    setError(null);
    if (!hasReadySource) {
      if (sourcesAreMediaOnly) {
        setError(
          "This pack only has video or audio. Those are not processed in v1, so generation cannot run yet. Upload a PDF, image, or text file.",
        );
      } else {
        setError(
          "Add at least one Ready source before generating. Video and audio stay unprocessed in v1.",
        );
      }
      return;
    }
    void runGenerate();
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          aria-disabled={disabled}
          title={
            !hasReadySource
              ? "Needs at least one Ready source"
              : "Generate all four study modes"
          }
        >
          {busy ? (
            <>
              <CircleNotch className="animate-spin" weight="bold" />
              Generating
            </>
          ) : (
            <>
              <Sparkle weight="fill" />
              Generate
            </>
          )}
        </Button>
        {!hasReadySource ? (
          <p className="text-xs text-muted-foreground">
            {sourcesAreMediaOnly
              ? "Video and audio only. Upload a PDF, image, or text file."
              : "Needs a Ready source to generate."}
          </p>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="max-w-xl text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
