import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db, installs, clicks } from "@/lib/db"
import { sql, gte } from "drizzle-orm"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get last 30 days of data
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Get installs grouped by date
    const installsByDate = await db
      .select({
        date: sql<string>`date(installed_at / 1000, 'unixepoch')`.as("date"),
        count: sql<number>`count(*)`.as("count"),
      })
      .from(installs)
      .where(gte(installs.installedAt, thirtyDaysAgo))
      .groupBy(sql`date(installed_at / 1000, 'unixepoch')`)
      .orderBy(sql`date(installed_at / 1000, 'unixepoch')`)

    // Get clicks grouped by date
    const clicksByDate = await db
      .select({
        date: sql<string>`date(clicked_at / 1000, 'unixepoch')`.as("date"),
        count: sql<number>`count(*)`.as("count"),
      })
      .from(clicks)
      .where(gte(clicks.clickedAt, thirtyDaysAgo))
      .groupBy(sql`date(clicked_at / 1000, 'unixepoch')`)
      .orderBy(sql`date(clicked_at / 1000, 'unixepoch')`)

    // Merge data
    const dateMap = new Map<string, { installs: number; clicks: number }>()

    // Generate all dates in range
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]
      dateMap.set(dateStr, { installs: 0, clicks: 0 })
    }

    // Fill in actual data
    for (const row of installsByDate) {
      const existing = dateMap.get(row.date)
      if (existing) {
        existing.installs = row.count
      }
    }

    for (const row of clicksByDate) {
      const existing = dateMap.get(row.date)
      if (existing) {
        existing.clicks = row.count
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
