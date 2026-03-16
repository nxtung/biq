/**
 * Database Configuration
 * 
 * Currently using IN-MEMORY store for v0 preview (better-sqlite3 native bindings don't work in v0 sandbox).
 * 
 * TO DEPLOY WITH SQLITE:
 * 1. Uncomment the SQLite section below
 * 2. Comment out the InMemoryStore section
 * 3. Run: pnpm db:push
 * 
 * TO DEPLOY WITH POSTGRESQL (Neon/Supabase):
 * 1. Install: pnpm add @neondatabase/serverless drizzle-orm
 * 2. Update schema.ts to use pg-core instead of sqlite-core
 * 3. Update drizzle.config.ts to use postgresql dialect
 * 4. Set DATABASE_URL environment variable
 */

// Re-export schema for drizzle types
export * from "./schema"

// ============================================================================
// SQLITE CONFIGURATION (uncomment for production deployment)
// ============================================================================
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import * as schema from "./schema"

declare global {
  // eslint-disable-next-line no-var
  var db: BetterSQLite3Database<typeof schema> | undefined
}

let db: BetterSQLite3Database<typeof schema>

if (process.env.NODE_ENV === "production") {
  const sqlite = new Database("amiotrack.db")
  sqlite.pragma("journal_mode = WAL")
  sqlite.pragma("foreign_keys = ON")
  db = drizzle(sqlite, { schema })
} else {
  if (!global.db) {
    const sqlite = new Database("amiotrack.db")
    sqlite.pragma("journal_mode = WAL")
    sqlite.pragma("foreign_keys = ON")
    // Enable logging in development for easier debugging
    global.db = drizzle(sqlite, { schema, logger: true })
  }
  db = global.db
}

export { db }