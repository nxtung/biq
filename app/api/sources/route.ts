import { db } from "@/lib/db"
import { campaignSources, campaigns } from "@/lib/db/schema"
import { getSession, canCreateCampaign } from "@/lib/auth"
import { eq, desc } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { nanoid } from "nanoid"
import QRCode from "qrcode"

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const campaignId = searchParams.get("campaignId")

  let query = db.select().from(campaignSources)
  
  if (campaignId) {
    query = query.where(eq(campaignSources.campaignId, campaignId)) as typeof query
  }

  const allSources = await query.orderBy(desc(campaignSources.createdAt))

  return NextResponse.json(allSources)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || !canCreateCampaign(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { campaignId, name: sourceName, type: sourceType, targetUrl } = body

    // Verify campaign exists
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    const id = nanoid(12)
    
    // Generate tracking URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const trackingUrl = `${baseUrl}/c/${id}`
    
    // Generate QR code as data URL
    const qrCode = await QRCode.toDataURL(trackingUrl, {
      width: 512,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })

    const [source] = await db.insert(campaignSources).values({
      id,
      campaignId,
      sourceName,
      sourceType,
      trackingUrl,
      targetUrl: targetUrl || null,
      qrCodeUrl: qrCode,
    }).returning()

    return NextResponse.json(source, { status: 201 })
  } catch (error) {
    console.error("Error creating source:", error)
    return NextResponse.json({ error: "Failed to create source" }, { status: 500 })
  }
}
