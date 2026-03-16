import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db, installs } from "@/lib/db"
import { isNotNull, count, desc } from "drizzle-orm"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // To avoid issues with raw SQL in the new driver, we use Drizzle's `count()` helper.
    const results = await db
      .select({
        province: installs.province,
        count: count(),
      })
      .from(installs)
      .where(isNotNull(installs.province))
      .groupBy(installs.province)
      .orderBy(desc(count()))

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
