"use client";

import { useMemo, useState } from "react";
import {
  CaretLeft,
  CaretRight,
  Cards,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import type { CardedItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type CardedViewProps = {
  contentJson: unknown | null;
  content: string | null;
};

function parseCards(
  contentJson: unknown | null,
  content: string | null,
): CardedItem[] {
  if (Array.isArray(contentJson)) {
    return contentJson.filter(isCard);
  }
  if (typeof content === "string" && content.trim()) {
    try {
      const parsed: unknown = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed.filter(isCard);
    } catch {
      return [];
    }
  }
  return [];
}

function isCard(value: unknown): value is CardedItem {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.front === "string" &&
    typeof v.back === "string"
  );
}

export function CardedView({ contentJson, content }: CardedViewProps) {
  const cards = useMemo(
    () => parseCards(contentJson, content),
    [contentJson, content],
  );
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (cards.length === 0) {
    return (
      <EmptyState
        icon={<Cards weight="duotone" className="size-5" />}
        title="Carded is empty"
        description="Generate the pack to build flashcards from the Summary. Flip a card, then step previous or next."
      />
    );
  }

  const safeIndex = Math.min(index, cards.length - 1);
  const card = cards[safeIndex]!;

  function go(delta: number) {
    setFlipped(false);
    setIndex((prev) => {
      const next = prev + delta;
      if (next < 0) return 0;
      if (next >= cards.length) return cards.length - 1;
      return next;
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>
          Card {safeIndex + 1} of {cards.length}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setIndex(0);
            setFlipped(false);
          }}
        >
          <ArrowCounterClockwise weight="bold" />
          Restart
        </Button>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className={cn(
          "group relative flex min-h-[220px] w-full flex-col items-center justify-center rounded-2xl border border-border/80 bg-surface/70 px-6 py-10 text-center shadow-[0_10px_30px_oklch(0_0_0/25%)] outline-none transition-[transform,background-color] duration-200 focus-visible:ring-3 focus-visible:ring-ring/40 sm:min-h-[260px]",
          flipped && "bg-primary/10 border-primary/30",
        )}
        aria-label={flipped ? "Show front" : "Show back"}
      >
        <span className="mb-3 text-[0.65rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          {flipped ? "Back" : "Front"}
        </span>
        <p className="font-reading text-lg leading-relaxed text-foreground sm:text-xl">
          {flipped ? card.back : card.front}
        </p>
        <span className="mt-6 text-xs text-muted-foreground">
          Tap to flip
        </span>
      </button>

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => go(-1)}
          disabled={safeIndex === 0}
        >
          <CaretLeft weight="bold" />
          Previous
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setFlipped((f) => !f)}
        >
          Flip
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => go(1)}
          disabled={safeIndex >= cards.length - 1}
        >
          Next
          <CaretRight weight="bold" />
        </Button>
      </div>
    </div>
  );
}
