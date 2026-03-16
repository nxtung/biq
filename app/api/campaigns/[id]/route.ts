import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { campaigns, clicks, installs, CAMPAIGN_STATUSES } from "@/lib/db/schema"
import { eq, count, desc } from "drizzle-orm"
import { z } from "zod"

const updateCampaignSchema = z.object({
  name: z.string().min(1, "Tên là bắt buộc").optional(),
  description: z.string().nullable().optional(),
  eventType: z.string().nullable().optional(), // Consider making this an enum if possible
  promotion: z.string().nullable().optional(),
  status: z.enum(CAMPAIGN_STATUSES).optional(),
  iosLink: z.string().url("Link iOS không hợp lệ").nullable().optional(),
  androidLink: z.string().url("Link Android không hợp lệ").nullable().optional(),
})

// GET /api/campaigns/[id] - Lấy chi tiết một chiến dịch
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id

    const campaignData = await db.query.campaigns.findFirst({
      where: eq(campaigns.id, campaignId),
      with: {
        sources: true,
        clicks: {
          with: { source: true }, // Tải thông tin nguồn cho mỗi click
          orderBy: [desc(clicks.clickedAt)], // Sắp xếp click mới nhất lên đầu
        },
        installs: {
          with: { source: true }, // Tải thông tin nguồn cho mỗi install
          orderBy: [desc(installs.installedAt)], // Sắp xếp install mới nhất lên đầu
        },
      },
    })

    if (!campaignData) {
      return NextResponse.json({ error: "Không tìm thấy chiến dịch" }, { status: 404 })
    }

    // Tính toán các chỉ số thống kê
    const [clicksResult] = await db
      .select({ value: count() })
      .from(clicks)
      .where(eq(clicks.campaignId, campaignId))

    const [installsResult] = await db
      .select({ value: count() })
      .from(installs)
      .where(eq(installs.campaignId, campaignId))

    const totalClicks = clicksResult.value
    const totalInstalls = installsResult.value
    const conversionRate = totalClicks > 0 ? (totalInstalls / totalClicks) * 100 : 0

    const response = {
      ...campaignData,
      stats: {
        totalClicks,
        totalInstalls,
        conversionRate,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[CAMPAIGN_GET]", error)
    return NextResponse.json({ error: "Lỗi máy chủ nội bộ" }, { status: 500 })
  }
}

// PUT /api/campaigns/[id] - Cập nhật một chiến dịch
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id
    const body = await req.json()
    const validation = updateCampaignSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 })
    }

    const [updatedCampaign] = await db
      .update(campaigns)
      .set(validation.data)
      .where(eq(campaigns.id, campaignId))
      .returning()

    if (!updatedCampaign) {
      return NextResponse.json({ error: "Không tìm thấy chiến dịch" }, { status: 404 })
    }

    return NextResponse.json(updatedCampaign)
  } catch (error) {
    console.error("[CAMPAIGN_PUT]", error)
    return NextResponse.json({ error: "Lỗi máy chủ nội bộ" }, { status: 500 })
  }
}

// DELETE /api/campaigns/[id] - Xóa một chiến dịch
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [deletedCampaign] = await db.delete(campaigns).where(eq(campaigns.id, params.id)).returning({ id: campaigns.id })

    if (!deletedCampaign) {
      return NextResponse.json({ error: "Không tìm thấy chiến dịch" }, { status: 404 })
    }

    return NextResponse.json({ message: "Đã xóa chiến dịch thành công" })
  } catch (error) {
    console.error("[CAMPAIGN_DELETE]", error)
    return NextResponse.json({ error: "Lỗi máy chủ nội bộ" }, { status: 500 })
  }
}