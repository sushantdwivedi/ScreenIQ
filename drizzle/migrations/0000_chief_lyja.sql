CREATE TABLE "screenings" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_name" text NOT NULL,
	"job_title" text NOT NULL,
	"ai_score" real NOT NULL,
	"reason_1" text NOT NULL,
	"reason_2" text NOT NULL,
	"reason_3" text NOT NULL,
	"model_used" text DEFAULT 'Llama-3.2-3B-Instruct-q4f16_1-MLC' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
