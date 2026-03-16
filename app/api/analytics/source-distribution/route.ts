import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db, installs, campaignSources } from "@/lib/db"
import { sql, eq } from "drizzle-orm"

const SOURCE_LABELS: Record<string, string> = {
  facebook: "Facebook",
  zalo: "Zalo",
  message: "Tin nhắn",
  youtube: "YouTube",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  qr: "QR Code",
  post: "Bài đăng",
  news: "Tin tức",
  partner_app: "App đối tác",
  partner_website: "Web đối tác",
  refer_code: "Mã giới thiệu",
  other: "Khác",
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get installs grouped by source type
    const results = await db
      .select({
        sourceType: campaignSources.sourceType,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(installs)
      .innerJoin(campaignSources, eq(installs.sourceId, campaignSources.id))
      .groupBy(campaignSources.sourceType)
      .orderBy(sql`count(*) desc`)
      .limit(10)

    const data = results.map((row) => ({
      source: SOURCE_LABELS[row.sourceType] || row.sourceType,
      installs: row.count,
    }))

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Source distribution error:", error)
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    )
  }
}
