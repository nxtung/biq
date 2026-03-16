import * as schema from "./schema"

import { NodePgDatabase, drizzle as drizzlePg } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import { NeonHttpDatabase, drizzle as drizzleNeon } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

const isVercel = !!process.env.VERCEL;

let db: NodePgDatabase<typeof schema> | NeonHttpDatabase<typeof schema>;

if (isVercel) {
  // Vercel runtime
  const sql = neon(process.env.DATABASE_URL)
  db = drizzleNeon(sql, { schema })
} else {
  // Local / seed
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })
  db = drizzlePg(pool, { schema, logger: true })
}

export { db }
export * from "./schema"