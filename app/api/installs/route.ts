import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { installs, installTokens, clicks, settings } from "@/lib/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { z } from "zod";
import { eq, and, sql, desc } from "drizzle-orm";
import { UAParser } from "ua-parser-js";
import { logActivity } from "@/lib/activity-log.service";

const installSchema = z.object({
  token: z.string().min(1).optional(),
  deviceInfo: z.any().optional(), // Thông tin thiết bị từ app (VD: model, OS version)
  // platform: z.enum(["ios", "android"]).optional(), // Có thể gửi thêm platform nếu cần
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = installSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    let { token, deviceInfo } = validation.data;

    let installTokenRecord = null;

    if (token) {
      // --- Trường hợp 1: Có token (chủ yếu cho Android) ---
      installTokenRecord = await db.query.installTokens.findFirst({
        where: eq(installTokens.token, token),
      });

      if (!installTokenRecord) {
        return NextResponse.json({ error: "Token không hợp lệ." }, { status: 400 });
      }
    } else {
      // --- Trường hợp 2: Không có token, thực hiện đối sánh xác suất (cho iOS) ---
      const headersList = req.headers;
      const ipAddress = headersList.get("x-forwarded-for") ?? headersList.get("x-real-ip");
      const userAgent = headersList.get("user-agent");

      if (!ipAddress || !userAgent) {
        return NextResponse.json({ error: "Không đủ thông tin để đối sánh." }, { status: 400 });
      }

      // Chỉ thực hiện đối sánh cho các thiết bị có vẻ là iOS
      const installParser = new UAParser(userAgent);
      const installOS = installParser.getOS().name?.toLowerCase();
      if (!installOS?.includes("ios") && !installOS?.includes("mac os")) {
        return NextResponse.json({ error: "Đối sánh vân tay chỉ được hỗ trợ cho thiết bị iOS." }, { status: 400 });
      }

      const matchingWindowSetting = await db.query.settings.findFirst({
        where: eq(settings.key, "matchingWindowMinutes"),
      });
      const matchingWindowMinutes = matchingWindowSetting?.value ? parseInt(matchingWindowSetting.value, 10) : 30; // Mặc định 30 phút cho matching
      const windowStart = new Date(Date.now() - matchingWindowMinutes * 60 * 1000);

      // 1. Tìm các click ứng viên gần đây từ cùng IP
      const candidateClicks = await db.query.clicks.findMany({
        where: and(
          eq(clicks.ipAddress, ipAddress),
          sql`${clicks.clickedAt} >= ${windowStart}`,
          // Chỉ xem xét các click từ thiết bị iOS
          eq(clicks.deviceType, 'ios')
        ),
        orderBy: [desc(clicks.clickedAt)],
      });

      if (candidateClicks.length === 0) {
        return NextResponse.json({ error: "Không tìm thấy click phù hợp để đối sánh." }, { status: 404 });
      }

      // 2. Tìm click đầu tiên trong danh sách ứng viên mà chưa được sử dụng
      let bestMatchClick = null;
      for (const click of candidateClicks) {
        const existingToken = await db.query.installTokens.findFirst({
          where: and(
            eq(installTokens.clickId, click.id),
            eq(installTokens.matched, true)
          )
        });
        if (!existingToken) {
          bestMatchClick = click;
          break; // Đã tìm thấy click phù hợp, chưa được sử dụng
        }
      }

      if (!bestMatchClick) {
        return NextResponse.json({ error: "Tất cả các click phù hợp đã được sử dụng." }, { status: 409 }); // 409 Conflict
      }

      // 3. Tạo một bản ghi installToken "tạm thời" để liên kết
      const pseudoTokenId = createId();
      [installTokenRecord] = await db.insert(installTokens).values({
        id: pseudoTokenId,
        token: `fp_${pseudoTokenId}`, // Dùng một token định danh cho fingerprint
        clickId: bestMatchClick.id,
        campaignId: bestMatchClick.campaignId,
        sourceId: bestMatchClick.sourceId,
        matched: false,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // Hết hạn sau 1 giờ
      }).returning();
    }

    if (!installTokenRecord) {
      return NextResponse.json({ error: "Không thể xử lý yêu cầu." }, { status: 500 });
    }

    // 2. Kiểm tra xem token đã được sử dụng chưa
    if (installTokenRecord.matched) {
      console.log(`Install already recorded for token ${installTokenRecord.token}`);
      return NextResponse.json({ message: "Install đã được ghi nhận trước đó." }, { status: 200 });
    }

    // 3. Kiểm tra thời gian hết hạn
    if (installTokenRecord.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "Token đã hết hạn." }, { status: 400 });
    }

    // 4. Ghi nhận lượt cài đặt
    const headersList = req.headers;
    const userAgent = headersList.get("user-agent");

    let deviceType: "ios" | "android" = "android";
    if (userAgent) {
      const parser = new UAParser(userAgent);
      const os = parser.getOS().name?.toLowerCase();
      if (os?.includes("ios") || os?.includes("mac")) {
        deviceType = "ios";
      }
    }

    const [newInstall] = await db
      .insert(installs)
      .values({
        id: createId(),
        installTokenId: installTokenRecord.id,
        campaignId: installTokenRecord.campaignId,
        sourceId: installTokenRecord.sourceId,
        deviceType: deviceType,
        deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null,
        province: null, // Để có province, bạn cần tích hợp dịch vụ Geo-IP
        matched: true,
        installedAt: new Date(),
      })
      .returning({ id: installs.id });

    // 5. Cập nhật trạng thái của installToken là đã được sử dụng
    await db
      .update(installTokens)
      .set({ matched: true })
      .where(eq(installTokens.id, installTokenRecord.id));

    // Ghi lại hoạt động install
    await logActivity({
      action: 'install',
      entityType: 'campaign_source',
      entityId: installTokenRecord.sourceId,
      details: { campaignId: installTokenRecord.campaignId, clickId: installTokenRecord.clickId },
    })

    return NextResponse.json({ installId: newInstall.id, message: "Install recorded successfully" }, { status: 201 });
  } catch (error) {
    console.error("[INSTALLS_POST]", error);
    return NextResponse.json({ error: "Lỗi máy chủ nội bộ" }, { status: 500 });
  }
}