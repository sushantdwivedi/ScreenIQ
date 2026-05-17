/**
 * Task B-3: Parse AI score output robustly.
 *
 * The LLM might return:
 *   - "7"         → 7
 *   - "7.3"       → 7.3
 *   - "Seven"     → 7
 *   - "Score: 8"  → 8
 *   - "8/10"      → 8
 *   - null / ""   → null (caller must handle)
 */

const WORD_TO_NUMBER: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4,
  five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

export function parseScore(raw: string | undefined | null): number | null {
  if (!raw) return null;

  const normalized = raw.trim().toLowerCase();

  // 1. Direct word match ("Seven", "seven")
  if (WORD_TO_NUMBER[normalized] !== undefined) {
    return WORD_TO_NUMBER[normalized];
  }

  // 2. Extract first decimal or integer from string ("Score: 7.3", "8/10")
  const match = normalized.match(/(\d+(?:\.\d+)?)/);
  if (match) {
    const n = parseFloat(match[1]);
    if (n >= 0 && n <= 10) return Math.round(n * 10) / 10; // clamp + 1 decimal
  }

  return null;
}

/**
 * Color-code a score for the dashboard (Task B-2)
 */
export function scoreToColor(score: number): {
  bg: string;
  text: string;
  label: string;
} {
  if (score >= 7.5) return { bg: "bg-emerald-50", text: "text-emerald-800", label: "Strong" };
  if (score >= 5)   return { bg: "bg-amber-50",   text: "text-amber-800",   label: "Review" };
  return              { bg: "bg-red-50",     text: "text-red-800",     label: "Weak" };
}