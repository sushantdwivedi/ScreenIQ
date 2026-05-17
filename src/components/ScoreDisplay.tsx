"use client";

import { scoreToColor } from "@/lib/utils";

interface ScoreDisplayProps {
  score: number | null;
  reasons: string[];
  streaming?: boolean;
  rawOutput?: string;
}

export function ScoreDisplay({ score, reasons, streaming, rawOutput }: ScoreDisplayProps) {
  if (streaming && !score) {
    return (
      <div className="mt-6">
        <div
          className="text-sm mb-2"
          style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-mono)" }}
        >
          Analysing...
        </div>
        <div
          className="text-xs p-3 rounded"
          style={{
            background: "var(--surface-container)",
            color: "var(--on-surface-variant)",
            fontFamily: "var(--font-mono)",
            whiteSpace: "pre-wrap",
            minHeight: "60px",
          }}
        >
          {rawOutput}
        </div>
      </div>
    );
  }

  if (!score) return null;

  const { bg, text, label } = scoreToColor(score);

  return (
    <div className="mt-6">
      {/* Score chip */}
      <div className="flex items-center gap-4 mb-4">
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded ${bg} ${text}`}
          style={{ border: "1px solid currentColor", opacity: 0.9 }}
        >
          <span className="text-2xl font-semibold data-mono">{score.toFixed(1)}</span>
          <span className="text-sm font-medium">/10</span>
        </div>
        <span className={`text-sm font-semibold px-3 py-1 rounded ${bg} ${text}`}>
          {label}
        </span>
      </div>

      {/* Reasons */}
      <ul className="space-y-2">
        {reasons.map((r, i) => (
          <li
            key={i}
            className="flex gap-3 text-sm"
            style={{ color: "var(--on-surface)" }}
          >
            <span
              className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold"
              style={{ background: "var(--primary)", color: "white" }}
            >
              {i + 1}
            </span>
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}