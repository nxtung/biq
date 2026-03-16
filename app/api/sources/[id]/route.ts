import { db } from "@/lib/db"
import { campaignSources } from "@/lib/db/schema"
import { getSession, canEditCampaign, canDeleteCampaign } from "@/lib/auth"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = params
  
  const [source] = await db
    .select()
    .from(campaignSources)
    .where(eq(campaignSources.id, id))

  if (!source) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 })
  }

  return NextResponse.json(source)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session || !canEditCampaign(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = params

  try {
    const body = await request.json()
    const { name: sourceName, type: sourceType, targetUrl, isActive } = body

    const [source] = await db
      .update(campaignSources)
      .set({
        sourceName,
        sourceType,
        targetUrl,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(campaignSources.id, id))
      .returning()

    return NextResponse.json(source)
  } catch (error) {
    console.error("Error updating source:", error)
    return NextResponse.json({ error: "Failed to update source" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session || !canDeleteCampaign(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = params

  try {
    await db.delete(campaignSources).where(eq(campaignSources.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting source:", error)
    return NextResponse.json({ error: "Failed to delete source" }, { status: 500 })
  }
}
