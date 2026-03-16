import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { campaignSources, campaigns, SOURCE_TYPES } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"
import { z } from "zod"
import QRCode from "qrcode"

const createSourceSchema = z.object({
  sourceName: z.string().min(1, "Tên nguồn là bắt buộc"),
  sourceType: z.enum(SOURCE_TYPES),
  targetUrl: z.string().url("Link đích không hợp lệ").nullable().optional(),
})

export async function POST(
  req: Request,
  // The folder is named [id], so the parameter is params.id
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id; // Use the 'id' from the URL as campaignId
    const body = await req.json()
    const validation = createSourceSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 })
    }

    const { sourceName, sourceType, targetUrl } = validation.data

    // 1. Kiểm tra xem chiến dịch có tồn tại không
    const campaign = await db.query.campaigns.findFirst({
      where: eq(campaigns.id, campaignId),
    })

    if (!campaign) {
      return NextResponse.json({ error: "Chiến dịch không tồn tại" }, { status: 404 })
    }

    // 2. Tạo ID và tracking URL duy nhất
    const newSourceId = createId()
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin
    const trackingUrl = `${baseUrl}/c/${newSourceId}`
    const qrCodeUrl = await QRCode.toDataURL(trackingUrl, { errorCorrectionLevel: 'H', margin: 2, width: 300 })

    // 3. Thêm nguồn mới vào database
    const [newSource] = await db
      .insert(campaignSources)
      .values({
        id: newSourceId,
        campaignId,
        sourceName,
        sourceType,
        targetUrl: targetUrl || null,
        trackingUrl,
        qrCodeUrl,
      })
      .returning()

    return NextResponse.json(newSource, { status: 201 })
  } catch (error) {
    console.error("[SOURCES_POST]", error)
    return NextResponse.json({ error: "Lỗi máy chủ nội bộ" }, { status: 500 })
  }
}