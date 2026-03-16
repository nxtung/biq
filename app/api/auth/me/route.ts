import { NextRequest, NextResponse } from "next/server"
import { getSession, setSession } from "@/lib/auth"
import { db, users } from "@/lib/db"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({ user: session })
  } catch (error) {
    console.error("Get session error:", error)
    return NextResponse.json({ user: null })
  }
}

export async function PATCH(
  request: NextRequest
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.id

  try {
    const body = await request.json()
    const { name, email } = body

    const updateData: Record<string, any> = {}

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: "Tên người dùng không được để trống hoặc chỉ chứa khoảng trắng" }, { status: 400 })
      }
      updateData.name = name
    }

    if (email !== undefined) {
      updateData.email = email === "" ? null : email
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const [updatedPartialUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
      })

    if (!updatedPartialUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Tải lại toàn bộ thông tin người dùng để tạo session mới
    const fullUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!fullUser) {
      return NextResponse.json({ error: "Could not find user after update." }, { status: 500 })
    }

    // Cập nhật session cookie với thông tin mới
    await setSession(fullUser)

    return NextResponse.json({ id: fullUser.id, name: fullUser.name, email: fullUser.email, phone: fullUser.phone, role: fullUser.role }, { status: 200 })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
