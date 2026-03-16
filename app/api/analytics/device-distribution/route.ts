import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db, installs } from "@/lib/db"
import { sql, eq } from "drizzle-orm"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get installs grouped by device type
    const iosCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(installs)
      .where(eq(installs.deviceType, "ios"))

    const androidCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(installs)
      .where(eq(installs.deviceType, "android"))

    const data = [
      { name: "iOS", value: iosCount[0]?.count || 0 },
      { name: "Android", value: androidCount[0]?.count || 0 },
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
