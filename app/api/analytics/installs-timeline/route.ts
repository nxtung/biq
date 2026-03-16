import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db, installs, clicks } from "@/lib/db"
import { sql } from "drizzle-orm"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get last 30 days of data
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Use sql template literal for raw SQL queries in Drizzle
    const query = sql`
  WITH daily_installs AS (
    SELECT
      date_trunc('day', "installs"."installed_at")::date AS date,
      count(*)::int AS installs_count
    FROM "installs"
    WHERE "installs"."installed_at" >= ${thirtyDaysAgo}
    GROUP BY 1
  ),
  daily_clicks AS (
    SELECT
      date_trunc('day', "clicks"."clicked_at")::date AS date,
      count(*)::int AS clicks_count
    FROM "clicks"
    WHERE "clicks"."clicked_at" >= ${thirtyDaysAgo}
    GROUP BY 1
  )
  SELECT
    COALESCE(di.date, dc.date) AS date,
    COALESCE(di.installs_count, 0) AS installs,
    COALESCE(dc.clicks_count, 0) AS clicks
  FROM daily_installs di
  FULL OUTER JOIN daily_clicks dc ON di.date = dc.date
`
    const result = await db.execute(query)
    const combinedData = result.rows as { date: Date; installs: number; clicks: number }[]

    const dateMap = new Map<string, { installs: number; clicks: number }>()

    // Generate all dates in range
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]
      dateMap.set(dateStr, { installs: 0, clicks: 0 })
    }

    // Fill in actual data
    for (const row of combinedData) {
      const dateStr = row.date.toISOString().split("T")[0]
      const existing = dateMap.get(dateStr)
      if (existing) {
        existing.installs = row.installs
        existing.clicks = row.clicks
      }
    }

    // Convert to array
    const data = Array.from(dateMap.entries()).map(([date, values]) => ({
      date: new Date(date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
      installs: values.installs,
      clicks: values.clicks,
    }))

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Installs timeline error:", error)
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    )
  }
}
