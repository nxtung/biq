import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clicks } from "@/lib/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { z } from "zod";
import { eq, and, sql, gte } from "drizzle-orm";
import { UAParser } from "ua-parser-js";

const clickSchema = z.object({
  campaignId: z.string().min(1),
  sourceId: z.string().min(1),
  fingerprint: z.string().optional(), // Fingerprint từ client
  fingerprintData: z.any().optional(), // Dữ liệu components thô từ FingerprintJS
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = clickSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { campaignId, sourceId, fingerprint, fingerprintData } = validation.data;

    const headersList = req.headers;
    const ipAddress = headersList.get("x-forwarded-for") ?? headersList.get("x-real-ip");
    const userAgent = headersList.get("user-agent");

    const parser = new UAParser(userAgent || undefined);
    const os = parser.getOS().name?.toLowerCase();
    let deviceType: "ios" | "android" | "desktop" | "other" = "other";
    if (os?.includes("ios") || os?.includes("mac os")) {
      deviceType = "ios";
    } else if (os?.includes("android")) {
      deviceType = "android";
    } else if (["windows", "linux"].some(p => os?.includes(p))) {
      deviceType = "desktop";
    }

    // Server-side deduplication: Kiểm tra click tương tự trong 5 phút gần nhất
    const DEDUPLICATION_WINDOW_MINUTES = 5;
    const fiveMinutesAgo = new Date(Date.now() - DEDUPLICATION_WINDOW_MINUTES * 60 * 1000);

    const existingClick = await db.query.clicks.findFirst({
      where: and(
        eq(clicks.sourceId, sourceId),
        fingerprint ? eq(clicks.fingerprint, fingerprint) : (ipAddress ? eq(clicks.ipAddress, ipAddress) : sql`1=0`),
        gte(clicks.clickedAt, fiveMinutesAgo)
      ),
    });

    if (existingClick) {
      console.log(`Deduplicated click for source ${sourceId} from ${fingerprint || ipAddress}. Returning existing clickId.`);
      return NextResponse.json({ clickId: existingClick.id }, { status: 200 });
    }

    const [newClick] = await db
      .insert(clicks)
      .values({
        id: createId(),
        campaignId,
        sourceId,
        ipAddress: ipAddress,
        userAgent: userAgent,
        fingerprint: fingerprint,
        fingerprintData: fingerprintData ? JSON.stringify(fingerprintData) : null,
        deviceType: deviceType,
        clickedAt: new Date(),
      })
      .returning({ id: clicks.id });

    return NextResponse.json({ clickId: newClick.id }, { status: 201 });
  } catch (error) {
    console.error("[CLICKS_POST]", error);
    return NextResponse.json({ error: "Lỗi máy chủ nội bộ" }, { status: 500 });
  }
}