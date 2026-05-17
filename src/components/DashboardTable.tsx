"use client";

import React from "react"
import { useState } from "react";
import type { Screening } from "@/lib/schema";
import { scoreToColor } from "@/lib/utils";

interface DashboardTableProps {
  initialData: Screening[];
  totalCount: number;
}

const PAGE_SIZE = 50;

export function DashboardTable({ initialData, totalCount }: DashboardTableProps) {
  const [data] = useState<Screening[]>(initialData);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Client-side pagination (for 500+ rows use react-window virtual scroll)
  const paginated = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(data.length / PAGE_SIZE);

  const thStyle = {
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "var(--on-surface-variant)",
    padding: "10px 16px",
    textAlign: "left" as const,
    borderBottom: "1px solid var(--outline-variant)",
  };

  return (
    <div>
      <div
        className="rounded-md overflow-hidden"
        style={{ border: "1px solid var(--outline-variant)" }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "var(--surface-container-low)" }}>
            <tr>
              <th style={thStyle}>Candidate</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Score</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Details</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((s) => {
              const { bg, text, label } = scoreToColor(s.aiScore);
              const isExpanded = expandedId === s.id;
              return (
                <React.Fragment key={s.id}>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--outline-variant)",
                      background: isExpanded ? "#f8f9ff" : "white",
                      transition: "background 0.2s",
                    }}
                  >
                    <td style={{ padding: "14px 16px", fontSize: "14px", fontWeight: 600, color: "var(--on-surface)" }}>
                      {s.candidateName}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "13px", color: "var(--on-surface-variant)" }}>
                      {s.jobTitle}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span className={`${bg} ${text}`} style={{
                        padding: "3px 10px", borderRadius: "2px", fontSize: "13px",
                        fontWeight: 700, fontFamily: "var(--font-mono)",
                        border: "1px solid currentColor", opacity: 0.85,
                      }}>
                        {s.aiScore.toFixed(1)} <span style={{ fontWeight: 400, fontSize: "11px" }}>{label}</span>
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "12px", color: "var(--on-surface-variant)", fontFamily: "var(--font-mono)" }}>
                      {new Date(s.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <button onClick={() => setExpandedId(isExpanded ? null : s.id)} style={{
                        fontSize: "12px", fontWeight: 600, color: "var(--secondary)",
                        background: "none", border: "none", cursor: "pointer", padding: 0,
                      }}>
                        {isExpanded ? "▲ Hide" : "▼ View"}
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr style={{ background: "#f8f9ff", borderBottom: "1px solid var(--outline-variant)" }}>
                      <td colSpan={5} style={{ padding: "16px 20px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                          {/* Reasons */}
                          <div>
                            <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--on-surface-variant)", marginBottom: "8px" }}>
                              AI Reasons
                            </p>
                            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
                              {[s.reason1, s.reason2, s.reason3].map((r, i) => (
                                <li key={i} style={{ display: "flex", gap: "8px", fontSize: "13px", color: "var(--on-surface)" }}>
                                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--on-surface-variant)", flexShrink: 0 }}>{i + 1}.</span>
                                  {r}
                                </li>
                              ))}
                            </ul>
                          </div>
                          {/* Resume (if saved) */}
                          {s.resumeText && (
                            <div>
                              <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--on-surface-variant)", marginBottom: "8px" }}>
                                Saved Resume
                              </p>
                              <pre style={{
                                fontFamily: "var(--font-mono)", fontSize: "11px",
                                color: "var(--on-surface-variant)", background: "var(--surface-container)",
                                borderRadius: "4px", padding: "10px", margin: 0,
                                maxHeight: "120px", overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word",
                              }}>
                                {s.resumeText}
                              </pre>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, data.length)} of {data.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: "6px 12px",
                fontSize: "13px",
                border: "1px solid var(--outline-variant)",
                borderRadius: "4px",
                background: "white",
                cursor: page === 1 ? "not-allowed" : "pointer",
                opacity: page === 1 ? 0.4 : 1,
              }}
            >
              Previous
            </button>
            <span
              className="text-sm flex items-center px-3"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {page}/{totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: "6px 12px",
                fontSize: "13px",
                border: "1px solid var(--outline-variant)",
                borderRadius: "4px",
                background: "white",
                cursor: page === totalPages ? "not-allowed" : "pointer",
                opacity: page === totalPages ? 0.4 : 1,
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}