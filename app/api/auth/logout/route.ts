import { NextResponse } from 'next/server'
import { deleteSession, getSession } from '@/lib/auth'
import { logActivity } from '@/lib/activity-log.service'

export async function POST(req: Request) {
  const session = await getSession()

  // Ghi lại hoạt động đăng xuất nếu có session
  if (session) {
    await logActivity({
      userId: session.id,
      action: 'logout',
      entityType: 'user',
      entityId: session.id,
      details: { name: session.name, phone: session.phone },
    })
  }

  // Gọi hàm để xóa session cookie một cách an toàn ở phía server
  // Luôn thực hiện việc này sau khi đã hoàn tất các tác vụ cần session
  deleteSession()

  // Trả về thông báo thành công
  return NextResponse.json({ message: 'Logged out successfully' })
}