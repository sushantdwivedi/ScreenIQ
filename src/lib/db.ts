import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// neon() creates a serverless SQL client using HTTP (works in Edge runtime)
const sql = neon(process.env.DATABASE_URL!);

// drizzle wraps it with type-safe query building
export const db = drizzle(sql, { schema });