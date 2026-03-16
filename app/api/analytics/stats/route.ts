import { db } from "@/lib/db/index"
import { campaigns, clicks, installs } from "@/lib/db/schema"
import { getSession } from "@/lib/auth"
import { sql } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Run all count queries in a single, more efficient database round-trip
    const result = await db.execute(sql`
      SELECT
        (SELECT count(*)::int FROM ${campaigns} WHERE ${campaigns.status} = 'active') as "totalCampaigns",
        (SELECT count(*)::int FROM ${clicks}) as "totalClicks",
        (SELECT count(*)::int FROM ${installs}) as "totalInstalls"
    `);

    const totals = result.rows[0] as { totalCampaigns: number; totalClicks: number; totalInstalls: number } | undefined;

    // Safely access the properties with default values
    const totalCampaigns = totals?.totalCampaigns ?? 0;
    const totalClicks = totals?.totalClicks ?? 0;
    const totalInstalls = totals?.totalInstalls ?? 0;

    // Calculate conversion rate
    const conversionRate = totalClicks > 0 ? (totalInstalls / totalClicks) * 100 : 0

    return NextResponse.json({
      stats: {
        totalCampaigns,
        totalClicks,
        totalInstalls,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
      }
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
