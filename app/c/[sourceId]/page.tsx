import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/db"
import { clicks, campaignSources } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { AppDownloadClient } from "./client"

export const dynamic = "force-dynamic" // Đảm bảo trang luôn được thực thi trên server cho mỗi request

export default async function TrackingPage({ params }: { params: { sourceId: string } }) {
  const { sourceId } = params

  // 1. Lấy dữ liệu nguồn và chiến dịch
  const source = await db.query.campaignSources.findFirst({
    where: eq(campaignSources.id, sourceId),
    with: {
      campaign: true,
    },
  })

  // Trả về 404 nếu:
  // - Không tìm thấy nguồn.
  // - Nguồn không hoạt động.
  // - Không tìm thấy chiến dịch liên quan.
  // - Chiến dịch không hoạt động.
  if (!source || !source.isActive || !source.campaign || source.campaign.status !== 'active') {
    return notFound()
  }

  // 2. Ghi nhận click trên server để đảm bảo độ tin cậy
  const headersList = headers()
  const ipAddress = headersList.get("x-forwarded-for") ?? headersList.get("x-real-ip")
  const userAgent = headersList.get("user-agent")

  // Pass necessary data to the client component for click recording and install token generation
  const clientProps = {
    campaign: source.campaign,
    source: source,
    ipAddress: ipAddress || null, // Pass IP from server headers
    userAgent: userAgent || null, // Pass UserAgent from server headers
  }

  // 3. Nếu có link đích cụ thể, chuyển hướng ngay lập tức
  if (source.targetUrl) {
    redirect(source.targetUrl)
  }

  // 4. Nếu không, hiển thị trang tải ứng dụng
  return <AppDownloadClient {...clientProps} />
}