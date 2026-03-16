"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { User as DbUser } from "@/lib/db/schema"
import { toast } from "sonner"
import { Spinner } from "./ui/spinner"

export type UserRole = "admin" | "marketing" | "user"

// This is the user object available in the client-side AuthContext.
// It's derived from the session payload but uses 'id' for consistency.
export interface User {
  id: string; // Mapped from 'sub' in the JWT
  phone: string
  email: string | null
  name: string
  role: UserRole
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean
  login: (phone: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const fetchUser = useCallback(async () => {
    // Không set isLoading ở đây để tránh loading khi refresh
    try {
      const res = await fetch("/api/auth/me")
      if (res.ok) {
        const { user: sessionPayload } = await res.json()
        if (sessionPayload) {
          // The session payload from the server now has an 'id' property directly.
          setUser(sessionPayload)
        } else {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      // Chỉ set false ở lần tải đầu tiên
      if (isLoading) {
        setIsLoading(false)
      }
    }
  }, [isLoading])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = async (phone: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || "Login failed")
    }
    
    // Tải lại thông tin người dùng và chuyển hướng
    await fetchUser()
    router.push("/dashboard")
    router.refresh()
  }

  const logout = async () => {
    try {
      // 1. Gọi API để xóa session cookie ở server
      await fetch('/api/auth/logout', { method: 'POST' });
      
      // 2. Xóa trạng thái người dùng ở client
      setUser(null);
      
      // 3. Chuyển hướng về trang đăng nhập
      router.push('/login');
      router.refresh();
      
      toast.success("Đã đăng xuất thành công.");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Không thể đăng xuất. Vui lòng thử lại.");
    }
  }

  const value = {
    user,
    isLoading,
    login,
    logout,
    refresh: fetchUser,
  }

  // Hiển thị màn hình loading toàn trang trong khi xác thực lần đầu
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner className="h-10 w-10 text-primary" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
