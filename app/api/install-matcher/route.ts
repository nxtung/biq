import { NextRequest, NextResponse } from "next/server"
import { db, installTokens, installs } from "@/lib/db"
import { eq, and, gt } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, deviceType, deviceInfo, fingerprint } = body

    if (!deviceType) {
      return NextResponse.json(
        { error: "Missing device type" },
        { status: 400 }
      )
    }

    let matched = false
    let campaignId: string | null = null
    let sourceId: string | null = null
    let installTokenId: string | null = null

    // Try to match by token first
    if (token) {
      const installToken = await db.query.installTokens.findFirst({
        where: and(
          eq(installTokens.token, token),
          eq(installTokens.matched, false),
          gt(installTokens.expiresAt, new Date())
        ),
      })

      if (installToken) {
        matched = true
        campaignId = installToken.campaignId
        sourceId = installToken.sourceId
        installTokenId = installToken.id

        // Mark token as matched
        await db
          .update(installTokens)
          .set({ matched: true })
          .where(eq(installTokens.id, installToken.id))
      }
    }

    // If no token match, try fingerprint match (within 10 min window)
    if (!matched && fingerprint) {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
      
      const recentToken = await db.query.installTokens.findFirst({
        where: and(
          eq(installTokens.matched, false),
          gt(installTokens.expiresAt, new Date()),
          gt(installTokens.createdAt, tenMinutesAgo)
        ),
      })

      if (recentToken) {
        try {
          const storedFingerprint = JSON.parse(recentToken.fingerprint || "{}")
          if (storedFingerprint.visitorId === fingerprint) {
            matched = true
            campaignId = recentToken.campaignId
            sourceId = recentToken.sourceId
            installTokenId = recentToken.id

            // Mark token as matched
            await db
              .update(installTokens)
              .set({ matched: true })
              .where(eq(installTokens.id, recentToken.id))
          }
        } catch {
          // Fingerprint parsing failed
        }
      }
    }

    // Record install if matched
    if (matched && campaignId && sourceId) {
      const installId = crypto.randomUUID()
      await db.insert(installs).values({
        id: installId,
        installTokenId,
        campaignId,
        sourceId,
        deviceType,
        deviceInfo: JSON.stringify(deviceInfo || {}),
        matched: true,
      })

      return NextResponse.json({
        success: true,
        matched: true,
        installId,
        campaignId,
        sourceId,
      })
    }

    // Record unmatched install (organic)
    // This requires a default campaign/source or we skip recording
    return NextResponse.json({
      success: true,
      matched: false,
      message: "No matching campaign found",
    })
  } catch (error) {
    console.error("Install matcher error:", error)
    return NextResponse.json(
      { error: "Failed to match install" },
      { status: 500 }
    )
  }
}
