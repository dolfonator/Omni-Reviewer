"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle,
  Eye,
  EyeSlash,
  ListChecks,
  XCircle,
} from "@phosphor-icons/react";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import type { TestMeItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type TestMeViewProps = {
  contentJson: unknown | null;
  content: string | null;
};

function parseItems(
  contentJson: unknown | null,
  content: string | null,
): TestMeItem[] {
  if (Array.isArray(contentJson)) {
    return contentJson.filter(isTestMeItem);
  }
  if (typeof content === "string" && content.trim()) {
    try {
      const parsed: unknown = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed.filter(isTestMeItem);
    } catch {
      return [];
    }
  }
  return [];
}

function isTestMeItem(value: unknown): value is TestMeItem {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.question === "string" &&
    typeof v.answer === "string" &&
    typeof v.explanation === "string"
  );
}

export function TestMeView({ contentJson, content }: TestMeViewProps) {
  const items = useMemo(
    () => parseItems(contentJson, content),
    [contentJson, content],
  );
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [showScore, setShowScore] = useState(false);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ListChecks weight="duotone" className="size-5" />}
        title="Test Me is empty"
        description="Generate the pack to build a questionnaire from Locked In. Answers stay on this device only."
      />
    );
  }

  const scorable = items.filter((item) => item.choices && item.choices.length > 0);
  let correct = 0;
  for (const item of scorable) {
    const pick = selected[item.id];
    if (pick && pick.trim().toLowerCase() === item.answer.trim().toLowerCase()) {
      correct += 1;
    }
  }

  function toggleReveal(id: string) {
    setRevealed((prev) => ({ ...prev, [id]: !prev[id] }));
    setShowScore(false);
  }

  function revealAll() {
    const next: Record<string, boolean> = {};
    for (const item of items) next[item.id] = true;
    setRevealed(next);
  }

  function hideAll() {
    setRevealed({});
    setShowScore(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={revealAll}>
          <Eye weight="bold" />
          Reveal answers
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={hideAll}>
          <EyeSlash weight="bold" />
          Hide answers
        </Button>
        {scorable.length > 0 ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowScore(true)}
          >
            Score locally
          </Button>
        ) : null}
        {showScore && scorable.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            {correct} of {scorable.length} choice questions correct (not saved)
          </p>
        ) : null}
      </div>

      <ol className="space-y-3">
        {items.map((item, index) => {
          const isOpen = !!revealed[item.id];
          const pick = selected[item.id];
          const isCorrect =
            pick &&
            pick.trim().toLowerCase() === item.answer.trim().toLowerCase();

          return (
            <li
              key={item.id}
              className="rounded-xl border border-border/80 bg-surface/50 p-4 sm:p-5"
            >
              <div className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-3">
                  <p className="text-sm font-medium leading-relaxed text-foreground">
                    {item.question}
                  </p>

                  {item.choices && item.choices.length > 0 ? (
                    <div
                      className="flex flex-col gap-2"
                      role="radiogroup"
                      aria-label={`Choices for question ${index + 1}`}
                    >
                      {item.choices.map((choice) => {
                        const active = pick === choice;
                        return (
                          <button
                            key={choice}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            className={cn(
                              "min-h-11 rounded-lg border px-3 py-2 text-left text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                              active
                                ? "border-primary/50 bg-primary/10 text-foreground"
                                : "border-border/80 bg-background/40 text-muted-foreground hover:border-border hover:text-foreground",
                            )}
                            onClick={() => {
                              setSelected((prev) => ({
                                ...prev,
                                [item.id]: choice,
                              }));
                              setShowScore(false);
                            }}
                          >
                            {choice}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => toggleReveal(item.id)}
                    >
                      {isOpen ? (
                        <>
                          <EyeSlash weight="bold" />
                          Hide answer
                        </>
                      ) : (
                        <>
                          <Eye weight="bold" />
                          Show answer
                        </>
                      )}
                    </Button>
                    {showScore && pick ? (
                      isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-xs text-success">
                          <CheckCircle weight="fill" />
                          Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-destructive">
                          <XCircle weight="fill" />
                          Incorrect
                        </span>
                      )
                    ) : null}
                  </div>

                  {isOpen ? (
                    <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-3 text-sm">
                      <p className="font-medium text-foreground">
                        Answer: {item.answer}
                      </p>
                      {item.explanation ? (
                        <p className="mt-1.5 leading-relaxed text-muted-foreground">
                          {item.explanation}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
