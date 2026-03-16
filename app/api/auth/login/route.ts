import { NextRequest, NextResponse } from "next/server"
import { authenticateUser, setSession } from "@/lib/auth"
import { logActivity } from "@/lib/activity-log.service"

export async function POST(request: NextRequest) {
  try {
    const { phone, password } = await request.json()

    if (!phone || !password) {
      return NextResponse.json(
        { error: "Vui lòng nhập số điện thoại và mật khẩu" },
        { status: 400 }
      )
    }

    // Validate Vietnamese phone number
    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/
    if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
      return NextResponse.json(
        { error: "Số điện thoại không hợp lệ" },
        { status: 400 }
      )
    }

    const user = await authenticateUser(phone, password)

    if (!user) {
      return NextResponse.json(
        { error: "Số điện thoại hoặc mật khẩu không đúng" },
        { status: 401 }
      )
    }

    await setSession(user)

    // Ghi lại hoạt động đăng nhập bằng service tập trung
    await logActivity({
      userId: user.id,
      action: "login",
      entityType: 'user',
      entityId: user.id
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Đã xảy ra lỗi, vui lòng thử lại" },
      { status: 500 }
    )
  }
}
