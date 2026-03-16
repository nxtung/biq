import { db } from "@/lib/db"
import { campaigns, users } from "@/lib/db/schema"
import { getSession, canCreateCampaign } from "@/lib/auth"
import { eq, desc, like, or, sql } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { nanoid } from "nanoid"

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    const whereClause = search
      ? or(
          like(campaigns.name, `%${search}%`),
          like(campaigns.description, `%${search}%`)
        )
      : undefined

    const allCampaigns = await db.query.campaigns.findMany({
      where: whereClause,
      with: {
        createdByUser: {
          columns: {
            name: true,
          },
        },
      },
      extras: {
        sourcesCount: sql<number>`(SELECT count(*) FROM campaign_sources WHERE campaign_sources.campaign_id = campaigns.id)`.as('sources_count'),
        clicksCount: sql<number>`(SELECT count(*) FROM clicks WHERE clicks.campaign_id = campaigns.id)`.as('clicks_count'),
        installsCount: sql<number>`(SELECT count(*) FROM installs WHERE installs.campaign_id = campaigns.id)`.as('installs_count'),
      },
      orderBy: [desc(campaigns.createdAt)],
    })

    return NextResponse.json({ campaigns: allCampaigns })
  } catch (error) {
    console.error("Error fetching campaigns:", error)
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || !canCreateCampaign(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { name, description, eventType, promotion, iosLink, androidLink } = body

    if (!name) {
      return NextResponse.json({ error: "Campaign name is required" }, { status: 400 })
    }

    const id = nanoid(12)

    const [campaign] = await db
      .insert(campaigns)
      .values({
        id,
        name,
        description,
        eventType,
        promotion,
        iosLink,
        androidLink,
        createdBy: session.id,
        // Explicitly set timestamps to ensure correct values are stored
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return NextResponse.json(campaign, { status: 201 })
  } catch (error) {
    console.error("Error creating campaign:", error)
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 })
  }
}