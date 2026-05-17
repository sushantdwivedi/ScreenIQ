import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { screenings } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";

// POST /api/screenings — save a screening result
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { candidateName, jobTitle, aiScore, reasons } = body;

    // Input validation
    if (!candidateName || !jobTitle || aiScore == null || !Array.isArray(reasons)) {
      return NextResponse.json(
        { error: "Missing required fields: candidateName, jobTitle, aiScore, reasons" },
        { status: 400 }
      );
    }

    if (typeof aiScore !== "number" || aiScore < 0 || aiScore > 10) {
      return NextResponse.json(
        { error: "aiScore must be a number between 0 and 10" },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(screenings)
      .values({
        candidateName: String(candidateName).slice(0, 200),  // prevent oversized strings
        jobTitle: String(jobTitle).slice(0, 200),
        resumeText: body.resumeText ? String(body.resumeText).slice(0, 20000) : null,
        aiScore,
        reason1: String(reasons[0] ?? "").slice(0, 500),
        reason2: String(reasons[1] ?? "").slice(0, 500),
        reason3: String(reasons[2] ?? "").slice(0, 500),
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("[POST /api/screenings]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/screenings — list all screenings (paginated)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50"));
    const offset = (page - 1) * limit;

    const results = await db
      .select()
      .from(screenings)
      .orderBy(desc(screenings.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ data: results, page, limit });
  } catch (err) {
    console.error("[GET /api/screenings]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}