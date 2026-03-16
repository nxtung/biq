import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db, installs } from "@/lib/db"
import { eq, count } from "drizzle-orm"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // To avoid issues with raw SQL in the new driver, we use Drizzle's `count()` helper.
    // We run both queries in parallel for efficiency.
    const [iosResult, androidResult] = await Promise.all([
      db
        .select({ value: count() })
        .from(installs)
        .where(eq(installs.deviceType, "ios")),
      db
        .select({ value: count() })
        .from(installs)
        .where(eq(installs.deviceType, "android")),
    ])

    const data = [
      { name: "iOS", value: iosResult[0]?.value || 0 },
      { name: "Android", value: androidResult[0]?.value || 0 },
    ]

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Device distribution error:", error)
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    )
  }
}
