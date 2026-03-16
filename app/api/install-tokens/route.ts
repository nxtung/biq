import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { installTokens, settings } from "@/lib/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { z } from "zod";
import { eq } from "drizzle-orm";

const createTokenSchema = z.object({
  clickId: z.string().min(1),
  campaignId: z.string().min(1),
  sourceId: z.string().min(1),
  fingerprint: z.string().optional(),
  deviceInfo: z.any().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = createTokenSchema.safeParse(body);

    if (!validation.success) {
      // Log the detailed validation error to the server console for debugging
      console.error("Validation Error in /api/install-tokens:", validation.error.flatten());
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { clickId, campaignId, sourceId, fingerprint, deviceInfo } = validation.data;

    // Lấy cài đặt thời gian matching từ DB
    const matchingWindowSetting = await db.query.settings.findFirst({
      where: eq(settings.key, "matchingWindowMinutes"),
    });
    const matchingWindowMinutes = matchingWindowSetting?.value ? parseInt(matchingWindowSetting.value, 10) : 10; // Mặc định 10 phút
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + matchingWindowMinutes * 60 * 1000);
    const token = createId();
    
    await db
      .insert(installTokens)
      .values({
        id: createId(),
        token,
        clickId,
        campaignId,
        sourceId,
        fingerprint: fingerprint || null,
        deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null,
        expiresAt,
      });

    return NextResponse.json({ token });
  } catch (error) {
    console.error("[INSTALL_TOKENS_POST]", error);
    return NextResponse.json({ error: "Lỗi máy chủ nội bộ" }, { status: 500 });
  }
}