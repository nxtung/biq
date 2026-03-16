"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { Plus, MoreHorizontal, Search, UserCog, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { useAuth } from "@/components/auth-provider"

const fetcher = (url: string) => fetch(url).then(res => res.json())

const roleLabels: Record<string, string> = {
  admin: "Quản trị viên",
  marketing: "Marketing",
  user: "Người dùng",
}

const roleColors: Record<string, string> = {
  admin: "bg-red-500/10 text-red-600 border-red-200",
  marketing: "bg-blue-500/10 text-blue-600 border-blue-200",
  user: "bg-gray-500/10 text-gray-600 border-gray-200",
}

interface User {
  id: string
  phone: string
  name: string | null
  role: string
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newUser, setNewUser] = useState({ phone: "", name: "", password: "", role: "user" })
  const [isCreating, setIsCreating] = useState(false)

  const { data: users, isLoading, mutate } = useSWR<User[]>("/api/users", fetcher)

  const filteredUsers = users?.filter(user =>
    user.phone.includes(searchQuery) ||
    user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const handleCreateUser = async () => {
    if (!newUser.phone || !newUser.password) {
      toast.error("Vui lòng nhập số điện thoại và mật khẩu")
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create user")
      }

      toast.success("Tạo người dùng thành công")
      setIsCreateOpen(false)
      setNewUser({ phone: "", name: "", password: "", role: "user" })
      mutate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo người dùng")
    } finally {
      setIsCreating(false)
    }
  }

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (!response.ok) throw new Error("Failed to update user")

      toast.success(isActive ? "Đã vô hiệu hóa người dùng" : "Đã kích hoạt người dùng")
      mutate()
    } catch {
      toast.error("Không thể cập nhật người dùng")
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Bạn có chắc muốn xóa người dùng này?")) return

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete user")

      toast.success("Đã xóa người dùng")
      mutate()
    } catch {
      toast.error("Không thể xóa người dùng")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{"Người dùng"}</h1>
          <p className="text-muted-foreground">{"Quản lý người dùng và phân quyền"}</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {"Thêm người dùng"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{"Thêm người dùng mới"}</DialogTitle>
              <DialogDescription>
                {"Tạo tài khoản mới cho người dùng trong hệ thống"}
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="phone">{"Số điện thoại"}</FieldLabel>
                <Input
                  id="phone"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  placeholder="0912345678"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="name">{"Họ tên"}</FieldLabel>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Nguyễn Văn A"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">{"Mật khẩu"}</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="••••••••"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="role">{"Vai trò"}</FieldLabel>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">{"Người dùng"}</SelectItem>
                    <SelectItem value="marketing">{"Marketing"}</SelectItem>
                    <SelectItem value="admin">{"Quản trị viên"}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                {"Hủy"}
              </Button>
              <Button onClick={handleCreateUser} disabled={isCreating}>
                {isCreating ? "Đang tạo..." : "Tạo người dùng"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{"Danh sách người dùng"}</CardTitle>
          <CardDescription>
            {"Tổng cộng"} {users?.length || 0} {"người dùng trong hệ thống"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo SĐT hoặc tên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{"Người dùng"}</TableHead>
                  <TableHead>{"Vai trò"}</TableHead>
                  <TableHead>{"Trạng thái"}</TableHead>
                  <TableHead>{"Đăng nhập cuối"}</TableHead>
                  <TableHead>{"Ngày tạo"}</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {"Không tìm thấy người dùng nào"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.name || "Chưa đặt tên"}</p>
                          <p className="text-sm text-muted-foreground">{user.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={roleColors[user.role]}>
                          {roleLabels[user.role] || user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? "Hoạt động" : "Vô hiệu"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.lastLoginAt
                          ? format(new Date(user.lastLoginAt), "dd/MM/yyyy HH:mm", { locale: vi })
                          : "Chưa đăng nhập"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(user.createdAt), "dd/MM/yyyy", { locale: vi })}
                      </TableCell>
                      <TableCell>
                        {currentUser?.id !== user.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleToggleActive(user.id, user.isActive)}>
                                <UserCog className="h-4 w-4 mr-2" />
                                {user.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {"Xóa"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
