import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db, installs } from "@/lib/db"
import { sql, isNotNull } from "drizzle-orm"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get installs grouped by province
    const results = await db
      .select({
        province: installs.province,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(installs)
      .where(isNotNull(installs.province))
      .groupBy(installs.province)
      .orderBy(sql`count(*) desc`)

    const data = results.map((row) => ({
      province: row.province || "Không xác định",
      installs: row.count,
    }))

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Province distribution error:", error)
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    )
  }
}
