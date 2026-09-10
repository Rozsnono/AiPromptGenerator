"use client";

import React from "react";

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  // Split lines and parse basic Markdown constructs cleanly
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLang = "";

  const renderInlineFormatted = (text: string): React.ReactNode => {
    // Bold: **text**
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-semibold text-zinc-100">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return (
          <em key={index} className="italic text-zinc-300">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={index}
            className="px-1.5 py-0.5 rounded bg-zinc-800/80 text-sky-300 font-mono text-xs border border-zinc-700/60"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  lines.forEach((line, idx) => {
    // Check code blocks
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        // End of code block
        elements.push(
          <div
            key={`code-${idx}`}
            className="my-3 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950/80 font-mono text-xs"
          >
            {codeBlockLang && (
              <div className="px-3 py-1 bg-zinc-900 border-b border-zinc-800/80 text-[10px] text-zinc-400 uppercase tracking-wider">
                {codeBlockLang}
              </div>
            )}
            <pre className="p-3 text-zinc-200 overflow-x-auto whitespace-pre leading-relaxed">
              {codeBlockContent.join("\n")}
            </pre>
          </div>
        );
        codeBlockContent = [];
        codeBlockLang = "";
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeBlockLang = line.trim().replace(/^```/, "").trim();
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }

    const trimmed = line.trim();

    // Headings
    if (trimmed.startsWith("# ")) {
      elements.push(
        <h1
          key={idx}
          className="text-xl sm:text-2xl font-bold text-zinc-100 mt-6 mb-3 pb-2 border-b border-zinc-800/80 flex items-center gap-2"
        >
          {renderInlineFormatted(trimmed.slice(2))}
        </h1>
      );
      return;
    }

    if (trimmed.startsWith("## ")) {
      elements.push(
        <h2
          key={idx}
          className="text-base sm:text-lg font-semibold text-sky-300 mt-5 mb-2.5 flex items-center gap-2"
        >
          {renderInlineFormatted(trimmed.slice(3))}
        </h2>
      );
      return;
    }

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3
          key={idx}
          className="text-sm sm:text-base font-medium text-zinc-200 mt-4 mb-2"
        >
          {renderInlineFormatted(trimmed.slice(4))}
        </h3>
      );
      return;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      elements.push(
        <blockquote
          key={idx}
          className="border-l-2 border-sky-400 pl-3 py-1 my-2 text-xs sm:text-sm text-zinc-400 bg-sky-950/10 rounded-r"
        >
          {renderInlineFormatted(trimmed.slice(2))}
        </blockquote>
      );
      return;
    }

    // Bullet list
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      elements.push(
        <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-zinc-300 my-1 pl-2">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0 mt-2" />
          <span>{renderInlineFormatted(trimmed.slice(2))}</span>
        </div>
      );
      return;
    }

    // Numbered list: e.g. 1. 2.
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      elements.push(
        <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-300 my-1 pl-2">
          <span className="font-mono text-xs text-sky-400 font-semibold shrink-0 mt-0.5">
            {numberedMatch[1]}.
          </span>
          <span>{renderInlineFormatted(numberedMatch[2])}</span>
        </div>
      );
      return;
    }

    // Empty line
    if (!trimmed) {
      elements.push(<div key={idx} className="h-2" />);
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={idx} className="text-xs sm:text-sm text-zinc-300 leading-relaxed my-1">
        {renderInlineFormatted(line)}
      </p>
    );
  });

  return <div className="space-y-1">{elements}</div>;
};
