"use client";

import { useState } from "react";
import { ArrowsClockwise, CircleNotch, Sparkle } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { readApiError } from "@/lib/utils";

export type ViewsPayload = {
  locked_in: SerializedView | null;
  summary: SerializedView | null;
  test_me: SerializedView | null;
  carded: SerializedView | null;
};

export type SerializedView = {
  id: string;
  reviewerId: string;
  kind: string;
  content: string;
  contentJson: unknown | null;
  generatedAt: string;
};

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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setConfirmOpen(false);
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
    if (hasViews) {
      setConfirmOpen(true);
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
              : hasViews
                ? "Regenerate all four views"
                : "Generate all four views"
          }
        >
          {busy ? (
            <>
              <CircleNotch className="animate-spin" weight="bold" />
              Generating
            </>
          ) : hasViews ? (
            <>
              <ArrowsClockwise weight="bold" />
              Regenerate
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

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate study views?</DialogTitle>
            <DialogDescription>
              This replaces Locked In, Summary, Test Me, and Carded with a fresh
              generation from the current Ready sources.
            </DialogDescription>
          </DialogHeader>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void runGenerate()}
              disabled={busy}
            >
              {busy ? (
                <>
                  <CircleNotch className="animate-spin" />
                  Regenerating
                </>
              ) : (
                "Regenerate"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
