"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

export default function ProfilePage() {
  const { user, refresh } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmittingInfo, setIsSubmittingInfo] = useState(false)
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name || "")
      setEmail(user.email || "")
    }
  }, [user])

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingInfo(true)
    try {
      const res = await fetch(`/api/users/${user?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update profile")
      }
      toast.success("Cập nhật thông tin thành công")
      refresh() // Refresh user data in auth context
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Đã có lỗi xảy ra")
    } finally {
      setIsSubmittingInfo(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu mới không khớp")
      return
    }
    if (!currentPassword || !newPassword) {
      toast.error("Vui lòng điền đầy đủ các trường mật khẩu")
      return
    }

    setIsSubmittingPassword(true)
    try {
      const res = await fetch(`/api/users/${user?.id}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update password")
      }
      toast.success("Đổi mật khẩu thành công")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Đã có lỗi xảy ra")
    } finally {
      setIsSubmittingPassword(false)
    }
  }

  if (!user) {
    return null // Or a loading state
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hồ sơ cá nhân</h1>
        <p className="text-muted-foreground">
          Quản lý thông tin tài khoản và cài đặt bảo mật của bạn.
        </p>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">
            Thông tin cá nhân
          </TabsTrigger>
          <TabsTrigger value="password">
            Đổi mật khẩu
          </TabsTrigger>
        </TabsList>
        <TabsContent value="info" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cá nhân</CardTitle>
              <CardDescription>Cập nhật họ tên và địa chỉ email của bạn.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInfoSubmit} className="max-w-md">
                <FieldGroup>
                  <Field>
                    <FieldLabel>Số điện thoại</FieldLabel>
                    <Input value={user.phone} disabled />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="name">Họ và tên</FieldLabel>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </Field>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmittingInfo}>
                      {isSubmittingInfo && <Spinner className="mr-2" />}
                      Lưu thay đổi
                    </Button>
                  </div>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="password" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Đổi mật khẩu</CardTitle>
              <CardDescription>Để bảo mật, hãy chọn một mật khẩu mạnh.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="max-w-md">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="currentPassword">Mật khẩu hiện tại</FieldLabel>
                    <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="newPassword">Mật khẩu mới</FieldLabel>
                    <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirmPassword">Xác nhận mật khẩu mới</FieldLabel>
                    <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                  </Field>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmittingPassword}>
                      {isSubmittingPassword && <Spinner className="mr-2" />}
                      Đổi mật khẩu
                    </Button>
                  </div>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
