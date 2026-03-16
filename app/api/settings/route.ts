import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { settings } from '@/lib/db/schema'
import { verifyAuth } from '@/lib/auth'
import { createId } from '@paralleldrive/cuid2'

// GET /api/settings - Lấy toàn bộ cài đặt
export async function GET(req: Request) {
  const { user } = await verifyAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const allSettings = await db.query.settings.findMany()
    
    // Chuyển mảng các cặp {key, value} thành một đối tượng cài đặt duy nhất
    const settingsObject = allSettings.reduce((acc: { [x: string]: any }, setting: { key: string | number; value: any }) => {
      try {
        // Cố gắng parse JSON cho các giá trị boolean, number,...
        acc[setting.key] = JSON.parse(setting.value || 'null')
      } catch {
        // Nếu parse lỗi, dùng giá trị chuỗi gốc
        acc[setting.key] = setting.value
      }
      return acc
    }, {} as Record<string, any>)

    return NextResponse.json(settingsObject)
  } catch (error) {
    console.error('[SETTINGS_GET]', error)
    return NextResponse.json({ error: 'Lỗi máy chủ nội bộ' }, { status: 500 })
  }
}

// PUT /api/settings - Cập nhật cài đặt
export async function PUT(req: Request) {
  const { user } = await verifyAuth()
  // Chỉ admin mới có quyền cập nhật cài đặt
  if (user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 })
  }

  try {
    const body = await req.json()

    // Sử dụng transaction để đảm bảo tất cả cài đặt được cập nhật đồng nhất
    await db.transaction(async (tx: any) => {
      for (const [key, value] of Object.entries(body)) {
        const stringValue = JSON.stringify(value)
        
        // "Upsert" - Cập nhật nếu đã tồn tại, nếu không thì tạo mới.
        await tx
          .insert(settings)
          .values({
            id: createId(),
            key,
            value: stringValue,
            updatedBy: user.id,
          })
          .onConflictDoUpdate({
            target: settings.key,
            set: {
              value: stringValue,
              updatedBy: user.id,
            },
          })
      }
    })

    return NextResponse.json({ message: 'Cài đặt đã được lưu' })
  } catch (error) {
    console.error('[SETTINGS_PUT]', error)
    return NextResponse.json({ error: 'Lỗi máy chủ nội bộ' }, { status: 500 })
  }
}