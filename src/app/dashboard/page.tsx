// Server Component — fetches data at request time
import { db } from "@/lib/db";
import { screenings } from "@/lib/schema";
import { desc } from "drizzle-orm";
import { DashboardTable } from "@/components/DashboardTable";

export const dynamic = "force-dynamic"; // always fresh data

export default async function DashboardPage() {
  // Fetch all screenings server-side (no client exposure of DB credentials)
  const data = await db
    .select()
    .from(screenings)
    .orderBy(desc(screenings.createdAt))
    .limit(500);        // 500+ row note: use virtual scroll for more

  const avgScore =
    data.length > 0
      ? (data.reduce((s, r) => s + r.aiScore, 0) / data.length).toFixed(1)
      : "—";

  const strong = data.filter((r) => r.aiScore >= 7.5).length;

  return (
    <div>
      <div className="mb-8">
        <h1
          className="text-3xl font-semibold mb-2"
          style={{ color: "var(--on-surface)", letterSpacing: "-0.02em" }}
        >
          Screening Dashboard
        </h1>
        <p style={{ color: "var(--on-surface-variant)", fontSize: "16px" }}>
          {data.length} screenings · Avg score: {avgScore} · {strong} strong candidates
        </p>
      </div>

      {data.length === 0 ? (
        <div
          className="text-center py-16 rounded-md"
          style={{ border: "1px dashed var(--outline-variant)", color: "var(--on-surface-variant)" }}
        >
          <p className="text-lg mb-2">No screenings yet</p>
          <a href="/screen" style={{ color: "var(--secondary)", fontSize: "14px", fontWeight: "600" }}>
            Screen your first candidate →
          </a>
        </div>
      ) : (
        <DashboardTable initialData={data} totalCount={data.length} />
      )}
    </div>
  );
}