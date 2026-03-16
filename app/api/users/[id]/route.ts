import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, type User, USER_ROLES } from '@/lib/db/schema'
import { verifyAuth, setSession } from '@/lib/auth'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const updateUserSchema = z.object({
  name: z.string().min(1, "Tên không được để trống").optional(),
  email: z.string().email("Email không hợp lệ").nullable().optional(), // Consider adding a .trim() and .toLowerCase() for consistency
  isActive: z.boolean().optional(),
  role: z.enum(USER_ROLES).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user: currentUser } = await verifyAuth()

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validation = updateUserSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const updateData = Object.fromEntries(
      Object.entries(validation.data).filter(([, v]) => v !== undefined)
    ) as Partial<typeof users.$inferInsert>

    // Chỉ admin mới có quyền thay đổi role hoặc isActive
    if (
      currentUser.role !== 'admin' &&
      (updateData.role !== undefined || updateData.isActive !== undefined)
    ) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      )
    }

    // User thường chỉ sửa profile của mình
    if (currentUser.role !== 'admin' && currentUser.id !== params.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only update your own profile' },
        { status: 403 }
      )
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, params.id))
      .returning()

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Không tìm thấy người dùng' },
        { status: 404 }
      )
    }

    // refresh session nếu user tự sửa profile
    if (currentUser.id === params.id) {
      await setSession(updatedUser)
    }

    return NextResponse.json(updatedUser)

  } catch (error) {
    console.error('[USER_PATCH]', error)
    return NextResponse.json(
      { error: 'Lỗi máy chủ nội bộ' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user: currentUser } = await verifyAuth()

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Chỉ admin mới xóa user và không được tự xóa mình
    if (currentUser.role !== 'admin' || currentUser.id === params.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, params.id))
      .returning({ id: users.id })

    if (!deletedUser) {
      return NextResponse.json(
        { error: 'Không tìm thấy người dùng' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Đã xóa người dùng' })

  } catch (error) {
    console.error('[USER_DELETE]', error)
    return NextResponse.json(
      { error: 'Lỗi máy chủ nội bộ' },
      { status: 500 }
    )
  }
}