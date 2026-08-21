import type { ReactNode } from "react";

import { EmptyState } from "@/components/empty-state";
import { BookOpenText } from "@phosphor-icons/react/dist/ssr";

type LockedInViewProps = {
  content: string | null;
};

/** Lightweight markdown renderer for study long-form (no extra deps). */
export function MarkdownBody({ source }: { source: string }) {
  const blocks = parseBlocks(source);
  return (
    <div className="prose-study">
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  );
}

type Block =
  | { type: "h1" | "h2" | "h3" | "h4"; text: string }
  | { type: "p"; text: string }
  | { type: "ul" | "ol"; items: string[] }
  | { type: "pre"; text: string }
  | { type: "blockquote"; text: string }
  | { type: "hr" };

function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    if (line.trim() === "") {
      i += 1;
      continue;
    }

    if (/^```/.test(line)) {
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i] ?? "")) {
        body.push(lines[i] ?? "");
        i += 1;
      }
      if (i < lines.length) i += 1;
      blocks.push({ type: "pre", text: body.join("\n") });
      continue;
    }

    if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
      blocks.push({ type: "hr" });
      i += 1;
      continue;
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const key = (`h${level}` as "h1" | "h2" | "h3" | "h4");
      blocks.push({ type: key, text: heading[2] });
      i += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const body: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i] ?? "")) {
        body.push((lines[i] ?? "").replace(/^>\s?/, ""));
        i += 1;
      }
      blocks.push({ type: "blockquote", text: body.join("\n") });
      continue;
    }

    if (/^[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^[-*+]\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    const body: string[] = [];
    while (
      i < lines.length &&
      (lines[i] ?? "").trim() !== "" &&
      !/^(#{1,4})\s+/.test(lines[i] ?? "") &&
      !/^```/.test(lines[i] ?? "") &&
      !/^[-*+]\s+/.test(lines[i] ?? "") &&
      !/^\d+\.\s+/.test(lines[i] ?? "") &&
      !/^>\s?/.test(lines[i] ?? "") &&
      !/^---+$/.test((lines[i] ?? "").trim())
    ) {
      body.push(lines[i] ?? "");
      i += 1;
    }
    blocks.push({ type: "p", text: body.join(" ") });
  }

  return blocks;
}

function Inline({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  const re =
    /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*")) {
      nodes.push(<em key={key++}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("`")) {
      nodes.push(<code key={key++}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith("[")) {
      const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (m) {
        nodes.push(
          <a key={key++} href={m[2]} target="_blank" rel="noreferrer">
            {m[1]}
          </a>,
        );
      } else {
        nodes.push(token);
      }
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}

function Block({ block }: { block: Block }) {
  switch (block.type) {
    case "h1":
      return (
        <h1>
          <Inline text={block.text} />
        </h1>
      );
    case "h2":
      return (
        <h2>
          <Inline text={block.text} />
        </h2>
      );
    case "h3":
      return (
        <h3>
          <Inline text={block.text} />
        </h3>
      );
    case "h4":
      return (
        <h4>
          <Inline text={block.text} />
        </h4>
      );
    case "p":
      return (
        <p>
          <Inline text={block.text} />
        </p>
      );
    case "ul":
      return (
        <ul>
          {block.items.map((item, i) => (
            <li key={i}>
              <Inline text={item} />
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol>
          {block.items.map((item, i) => (
            <li key={i}>
              <Inline text={item} />
            </li>
          ))}
        </ol>
      );
    case "pre":
      return (
        <pre>
          <code>{block.text}</code>
        </pre>
      );
    case "blockquote":
      return (
        <blockquote>
          <Inline text={block.text} />
        </blockquote>
      );
    case "hr":
      return <hr />;
    default:
      return null;
  }
}

export function LockedInView({ content }: LockedInViewProps) {
  if (!content || !content.trim()) {
    return (
      <EmptyState
        icon={<BookOpenText weight="duotone" className="size-5" />}
        title="Locked In is empty"
        description="Generate the pack to write the full study document from your Ready sources. This mode is the source of truth for the other three."
      />
    );
  }

  return (
    <article className="reading-surface rounded-xl px-5 py-6 shadow-[0_8px_30px_oklch(0_0_0/20%)] sm:px-8 sm:py-8">
      <MarkdownBody source={content} />
    </article>
  );
}
