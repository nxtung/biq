import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { User, users } from './db/schema'
import { db } from './db'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

// Định nghĩa kiểu dữ liệu cho payload của session để code rõ ràng hơn
interface JwtPayload {
  sub: string // User ID
  role: User['role']
  name: string
  phone: string
  email: string | null
  iat: number
  exp: number
}

// Đây là đối tượng session nhất quán được sử dụng trên toàn bộ server-side
export interface ServerSession {
  id: string;
  role: User['role'];
  name: string;
  phone: string;
  email: string | null;
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET)
const sessionDuration = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

// Hàm này lấy session từ cookie và giải mã nó
export async function getSession(): Promise<ServerSession | null> {
  const token = cookies().get('session')?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify<JwtPayload>(token, secret)
    // Chuyển đổi từ payload của JWT (với 'sub') sang đối tượng session (với 'id')
    return {
      id: payload.sub,
      role: payload.role,
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
    }
  } catch (error) {
    return null
  }
}

// Hàm này tạo và thiết lập session cookie
export async function setSession(user: User) {
  const expires = new Date(Date.now() + sessionDuration)
  const session = await new SignJWT({ sub: user.id, role: user.role, name: user.name, phone: user.phone, email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(secret)

  cookies().set('session', session, {
    expires,
    httpOnly: true,
    path: '/',
  })
}

// Hàm này xóa session cookie
export function deleteSession() {
  cookies().set('session', '', { expires: new Date(0), path: '/' })
}

// Hàm này xác thực người dùng bằng phone và password
export async function authenticateUser(phone: string, password: string): Promise<User | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.phone, phone),
  })

  if (!user) {
    return null
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash)

  if (isPasswordCorrect) {
    // Cập nhật lastLoginAt
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id))
    return user
  }

  return null
}

// Hàm này sẽ được dùng trong các API Route và Server Action để xác thực session của người dùng.
export async function verifyAuth(): Promise<{ user: ServerSession | null }> {
  const session = await getSession()
  return { user: session }
}

// Hàm kiểm tra quyền quản lý người dùng
export function canManageUsers(role: User['role']) {
  return role === 'admin'
}

export function canCreateCampaign(role: string) {
  return role === "admin" || role === "marketing"
}