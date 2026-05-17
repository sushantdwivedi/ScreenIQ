import { pgTable, text, integer, timestamp, serial, real } from "drizzle-orm/pg-core";

export const screenings = pgTable("screenings", {
  id: serial("id").primaryKey(),
  candidateName: text("candidate_name").notNull(),
  jobTitle: text("job_title").notNull(),
resumeText: text("resume_text"),
  aiScore: real("ai_score").notNull(),           // float, 1.0–10.0
  reason1: text("reason_1").notNull(),
  reason2: text("reason_2").notNull(),
  reason3: text("reason_3").notNull(),
  modelUsed: text("model_used").notNull().default("Llama-3.2-3B-Instruct-q4f16_1-MLC"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Screening = typeof screenings.$inferSelect;
export type NewScreening = typeof screenings.$inferInsert;