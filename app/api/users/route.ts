import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { getSession, canManageUsers } from "@/lib/auth"
import { desc } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { nanoid } from "nanoid"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || !canManageUsers(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const allUsers = await db
    .select({
      id: users.id,
      phone: users.phone,
      name: users.name,
      role: users.role,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))

  return NextResponse.json(allUsers)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || !canManageUsers(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { phone, name, password, role } = body

    if (!phone || !password) {
      return NextResponse.json({ error: "Phone and password are required" }, { status: 400 })
    }

    // Check if phone already exists
    const existing = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.phone, phone),
    })

    if (existing) {
      return NextResponse.json({ error: "Số điện thoại đã tồn tại" }, { status: 400 })
    }

    const id = nanoid(12)
    const passwordHash = await bcrypt.hash(password, 10)

    const [user] = await db.insert(users).values({
      id,
      phone,
      name: name || null,
      passwordHash,
      role: role || "user",
    }).returning({
      id: users.id,
      phone: users.phone,
      name: users.name,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
