import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, User } from '@/lib/db/schema'
import { verifyAuth, setSession } from '@/lib/auth'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const updateUserSchema = z.object({
  name: z.string().min(1, "Tên không được để trống"),
  email: z.string().email("Email không hợp lệ").nullable().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { user: currentUser } = await verifyAuth()

  // Người dùng chỉ có thể tự cập nhật thông tin của chính mình
  if (!currentUser || currentUser.id !== params.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const validation = updateUserSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 })
    }

    const { name, email } = validation.data

    // Cập nhật người dùng trong database
    const [updatedUser] = await db
      .update(users)
      .set({
        name,
        email: email || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, params.id))
      .returning()

    if (!updatedUser) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 })
    }

    // *** Bước quan trọng nhất ***
    // Tạo lại session cookie với thông tin người dùng đã được cập nhật
    await setSession(updatedUser as User)

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('[USER_PATCH]', error)
    return NextResponse.json({ error: 'Lỗi máy chủ nội bộ' }, { status: 500 })
  }
}