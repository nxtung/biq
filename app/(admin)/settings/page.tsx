"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { FieldGroup, Field, FieldLabel, FieldDescription } from "@/components/ui/field"
import { toast } from "sonner"
import { Save, Globe, Smartphone, Bell, Shield, Link2 } from "lucide-react"

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface Settings {
  appName: string
  companyName: string
  appStoreUrl: string
  playStoreUrl: string
  matchingWindowMinutes: number
  enableNotifications: boolean
  enableEmailAlerts: boolean
  alertEmail: string
  requireAuth: boolean
}

export default function SettingsPage() {
  const { data: settings, mutate } = useSWR<Settings>("/api/settings", fetcher)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<Settings>({
    appName: "Amio",
    companyName: "Công ty Cổ phần Công nghệ DGX",
    appStoreUrl: "",
    playStoreUrl: "",
    matchingWindowMinutes: 10,
    enableNotifications: true,
    enableEmailAlerts: false,
    alertEmail: "",
    requireAuth: true,
  })

  useEffect(() => {
    if (settings) {
      setFormData(settings)
    }
  }, [settings])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Failed to save settings")

      mutate(formData)
      toast.success("Cài đặt đã được lưu thành công")
    } catch {
      toast.error("Không thể lưu cài đặt")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{"Cài đặt"}</h1>
          <p className="text-muted-foreground">{"Quản lý cài đặt hệ thống và ứng dụng"}</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="gap-2">
            <Globe className="h-4 w-4" />
            {"Chung"}
          </TabsTrigger>
          <TabsTrigger value="app" className="gap-2">
            <Smartphone className="h-4 w-4" />
            {"Ứng dụng"}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            {"Thông báo"}
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            {"Bảo mật"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>{"Thông tin chung"}</CardTitle>
              <CardDescription>{"Cấu hình thông tin cơ bản của hệ thống"}</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="appName">{"Tên ứng dụng"}</FieldLabel>
                  <Input
                    id="appName"
                    value={formData.appName}
                    onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                    placeholder="Amio"
                  />
                  <FieldDescription>{"Tên hiển thị trên landing page và thông báo"}</FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="companyName">{"Tên công ty"}</FieldLabel>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Công ty Cổ phần Công nghệ DGX"
                  />
                  <FieldDescription>{"Hiển thị ở footer của landing page"}</FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="app">
          <Card>
            <CardHeader>
              <CardTitle>{"Cấu hình ứng dụng"}</CardTitle>
              <CardDescription>{"Liên kết cửa hàng ứng dụng và cài đặt tracking"}</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="appStoreUrl">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      {"App Store URL"}
                    </div>
                  </FieldLabel>
                  <Input
                    id="appStoreUrl"
                    value={formData.appStoreUrl}
                    onChange={(e) => setFormData({ ...formData, appStoreUrl: e.target.value })}
                    placeholder="https://apps.apple.com/app/..."
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="playStoreUrl">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      {"Google Play URL"}
                    </div>
                  </FieldLabel>
                  <Input
                    id="playStoreUrl"
                    value={formData.playStoreUrl}
                    onChange={(e) => setFormData({ ...formData, playStoreUrl: e.target.value })}
                    placeholder="https://play.google.com/store/apps/..."
                  />
                </Field>

                <Separator />

                <Field>
                  <FieldLabel htmlFor="matchingWindow">{"Khoảng thời gian matching (phút)"}</FieldLabel>
                  <Input
                    id="matchingWindow"
                    type="number"
                    min={1}
                    max={60}
                    value={formData.matchingWindowMinutes}
                    onChange={(e) => setFormData({ ...formData, matchingWindowMinutes: parseInt(e.target.value) || 10 })}
                  />
                  <FieldDescription>
                    {"Thời gian tối đa để matching click với install (mặc định: 10 phút)"}
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{"Cài đặt thông báo"}</CardTitle>
              <CardDescription>{"Quản lý cách thức nhận thông báo"}</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{"Thông báo trong ứng dụng"}</Label>
                    <p className="text-sm text-muted-foreground">
                      {"Nhận thông báo khi có install mới"}
                    </p>
                  </div>
                  <Switch
                    checked={formData.enableNotifications}
                    onCheckedChange={(checked) => setFormData({ ...formData, enableNotifications: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{"Thông báo qua email"}</Label>
                    <p className="text-sm text-muted-foreground">
                      {"Gửi email khi có sự kiện quan trọng"}
                    </p>
                  </div>
                  <Switch
                    checked={formData.enableEmailAlerts}
                    onCheckedChange={(checked) => setFormData({ ...formData, enableEmailAlerts: checked })}
                  />
                </div>

                {formData.enableEmailAlerts && (
                  <Field>
                    <FieldLabel htmlFor="alertEmail">{"Email nhận thông báo"}</FieldLabel>
                    <Input
                      id="alertEmail"
                      type="email"
                      value={formData.alertEmail}
                      onChange={(e) => setFormData({ ...formData, alertEmail: e.target.value })}
                      placeholder="admin@example.com"
                    />
                  </Field>
                )}
              </FieldGroup>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>{"Bảo mật"}</CardTitle>
              <CardDescription>{"Cấu hình bảo mật và quyền truy cập"}</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{"Yêu cầu xác thực cho API"}</Label>
                    <p className="text-sm text-muted-foreground">
                      {"Bắt buộc token xác thực cho tất cả API endpoints"}
                    </p>
                  </div>
                  <Switch
                    checked={formData.requireAuth}
                    onCheckedChange={(checked) => setFormData({ ...formData, requireAuth: checked })}
                  />
                </div>
              </FieldGroup>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
