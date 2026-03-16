import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { campaignSources, SOURCE_TYPES } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { z } from "zod"

const updateSourceSchema = z.object({
  sourceName: z.string().min(1, "Tên nguồn là bắt buộc").optional(),
  sourceType: z.enum(SOURCE_TYPES).optional(),
  targetUrl: z.string().url("Link đích không hợp lệ").nullable().optional(),
  isActive: z.boolean().optional(),
})

// PUT handler để cập nhật nguồn
export async function PUT(
  req: Request,
  { params }: { params: { id: string; sourceId: string } } // Note: `params.id` is the campaignId
) {
  try {
    const { id: campaignId, sourceId } = params; // Rename `id` to `campaignId` for clarity
    const body = await req.json()
    const validation = updateSourceSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 })
    }

    const [updatedSource] = await db
      .update(campaignSources)
      .set(validation.data)
      .where(and(eq(campaignSources.id, sourceId), eq(campaignSources.campaignId, campaignId)))
      .returning()

    if (!updatedSource) {
      return NextResponse.json({ error: "Không tìm thấy nguồn" }, { status: 404 })
    }

    return NextResponse.json(updatedSource)
  } catch (error) {
    console.error("[SOURCES_PUT]", error)
    return NextResponse.json({ error: "Lỗi máy chủ nội bộ" }, { status: 500 })
  }
}

// DELETE handler để xóa nguồn
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; sourceId: string } } // Note: `params.id` is the campaignId
) {
  try {
    const { id: campaignId, sourceId } = params; // Rename `id` to `campaignId` for clarity

    const [deletedSource] = await db
      .delete(campaignSources)
      .where(and(eq(campaignSources.id, sourceId), eq(campaignSources.campaignId, campaignId)))
      .returning({ id: campaignSources.id })

    if (!deletedSource) {
      return NextResponse.json({ error: "Không tìm thấy nguồn" }, { status: 404 })
    }

    return NextResponse.json({ message: "Đã xóa nguồn thành công" })
  } catch (error) {
    console.error("[SOURCES_DELETE]", error)
    return NextResponse.json({ error: "Lỗi máy chủ nội bộ" }, { status: 500 })
  }
}