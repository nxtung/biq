import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { activityLogs, users } from '@/lib/db/schema'
import { verifyAuth } from '@/lib/auth'
import { desc, eq, count, like, and, or } from 'drizzle-orm'

export async function GET(req: Request) {
  const { user } = await verifyAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const action = searchParams.get('action')
    const search = searchParams.get('search')

    const offset = (page - 1) * limit

    // Xây dựng điều kiện WHERE một cách linh hoạt
    const whereConditions = []
    if (action && action !== 'all') {
      whereConditions.push(eq(activityLogs.action, action))
    }
    if (search) {
      const searchQuery = `%${search}%`
      whereConditions.push(
        or(
          like(users.name, searchQuery),
          like(users.phone, searchQuery),
          like(activityLogs.ipAddress, searchQuery)
        )
      )
    }

    // Truy vấn log và join với bảng users để lấy tên
    const logs = await db
      .select({
        id: activityLogs.id,
        action: activityLogs.action,
        entityType: activityLogs.entityType,
        entityId: activityLogs.entityId,
        userId: activityLogs.userId,
        userName: users.name, // Lấy tên người dùng từ bảng users
        details: activityLogs.details,
        ipAddress: activityLogs.ipAddress,
        userAgent: activityLogs.userAgent,
        createdAt: activityLogs.createdAt,
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .where(and(...whereConditions))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit)
      .offset(offset)

    // Truy vấn tổng số bản ghi để phân trang
    const [totalResult] = await db
      .select({ total: count() })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .where(and(...whereConditions))

    return NextResponse.json({
      logs,
      total: totalResult.total,
    })
  } catch (error) {
    console.error('[ACTIVITY_GET]', error)
    return NextResponse.json({ error: 'Lỗi máy chủ nội bộ' }, { status: 500 })
  }
}