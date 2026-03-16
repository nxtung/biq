import 'server-only'
import { headers } from 'next/headers'
import { db } from './db'
import { activityLogs, type NewActivityLog } from './db/schema'
import { createId } from '@paralleldrive/cuid2'

// Cho phép `details` là một đối tượng bất kỳ để dễ dàng truyền dữ liệu
type LogPayload = Omit<NewActivityLog, 'id' | 'ipAddress' | 'userAgent' | 'createdAt' | 'details'> & {
  details?: Record<string, any> | null;
}

/**
 * Ghi lại một hoạt động vào nhật ký hệ thống.
 * Tự động thu thập IP và User Agent từ request headers.
 * @param payload - Dữ liệu của log cần ghi.
 */
export async function logActivity(payload: LogPayload) {
  try {
    const headersList = headers()
    const ipAddress = headersList.get('x-forwarded-for') ?? headersList.get('x-real-ip')
    const userAgent = headersList.get('user-agent')

    await db.insert(activityLogs).values({
      id: createId(),
      // Ánh xạ tường minh từng trường để đảm bảo thứ tự đúng
      userId: payload.userId ?? null,
      action: payload.action,
      entityType: payload.entityType,
      entityId: payload.entityId,
      details: payload.details ? JSON.stringify(payload.details) : null,
      ipAddress,
      userAgent,
    })
  } catch (error) {
    // Trong môi trường production, có thể muốn log lỗi này
    // vào một hệ thống giám sát riêng thay vì chỉ console.log
    console.error('Failed to log activity:', error)
  }
}