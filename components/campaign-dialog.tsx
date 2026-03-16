"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"

interface CampaignDialogProps {
  open: boolean
  onClose: () => void
  campaign?: {
    id: string
    name: string
    description: string | null
    eventType: string | null
    promotion: string | null
    status: string
    iosLink: string | null
    androidLink: string | null
  } | null
}

export function CampaignDialog({ open, onClose, campaign }: CampaignDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [eventType, setEventType] = useState("")
  const [promotion, setPromotion] = useState("")
  const [status, setStatus] = useState("active")
  const [iosLink, setIosLink] = useState("")
  const [androidLink, setAndroidLink] = useState("")

  const isEditing = !!campaign

  useEffect(() => {
    if (campaign) {
      setName(campaign.name)
      setDescription(campaign.description || "")
      setEventType(campaign.eventType || "")
      setPromotion(campaign.promotion || "")
      setStatus(campaign.status)
      setIosLink(campaign.iosLink || "")
      setAndroidLink(campaign.androidLink || "")
    } else {
      setName("")
      setDescription("")
      setEventType("")
      setPromotion("")
      setStatus("active")
      setIosLink("")
      setAndroidLink("")
    }
  // Bỏ `open` khỏi dependency array để tránh reset form khi dialog đang đóng,
  // giúp trải nghiệm người dùng mượt mà hơn. State giờ chỉ cập nhật khi
  // prop `campaign` thực sự thay đổi.
  }, [campaign])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = isEditing ? `/api/campaigns/${campaign.id}` : "/api/campaigns"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          eventType: eventType || null,
          promotion: promotion || null,
          status,
          iosLink: iosLink || null,
          androidLink: androidLink || null,
        }),
      })

      if (res.ok) {
        toast.success(isEditing ? "Đã cập nhật chiến dịch" : "Đã tạo chiến dịch")
        onClose()
      } else {
        const data = await res.json()
        toast.error(data.error || "Không thể lưu chiến dịch")
      }
    } catch {
      toast.error("Đã xảy ra lỗi")
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={() => !isLoading && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Chỉnh sửa chiến dịch" : "Tạo chiến dịch mới"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Cập nhật thông tin chiến dịch"
              : "Điền thông tin để tạo chiến dịch marketing mới"}
          </DialogDescription>
        </DialogHeader>

        {/* Form được gán ID để các nút bên ngoài có thể tương tác */}
        <form id="campaign-form" onSubmit={handleSubmit}>
          {/* Thay thế FieldGroup bằng một div có thể cuộn */}
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
            <Field>
              <FieldLabel htmlFor="name">Tên chiến dịch *</FieldLabel>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Chiến dịch Tết 2026"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="description">Mô tả</FieldLabel>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả ngắn về chiến dịch"
                rows={3}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="eventType">Loại sự kiện</FieldLabel>
                <Input
                  id="eventType"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  placeholder="VD: Ra mắt, Khuyến mãi"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="status">Trạng thái</FieldLabel>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="paused">Tạm dừng</SelectItem>
                    <SelectItem value="ended">Kết thúc</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="promotion">Khuyến mãi</FieldLabel>
              <Input
                id="promotion"
                value={promotion}
                onChange={(e) => setPromotion(e.target.value)}
                placeholder="VD: Giảm 50% tháng đầu tiên"
              />
            </Field>

            {/* Always show link fields */}
            <Field>
              <FieldLabel htmlFor="iosLink">Link App Store</FieldLabel>
              <Input
                id="iosLink"
                type="url"
                value={iosLink}
                onChange={(e) => setIosLink(e.target.value)}
                placeholder="https://apps.apple.com/..."
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="androidLink">Link Google Play</FieldLabel>
              <Input
                id="androidLink"
                type="url"
                value={androidLink}
                onChange={(e) => setAndroidLink(e.target.value)}
                placeholder="https://play.google.com/..."
              />
            </Field>
          </div>
        </form>

        {/* Footer được đưa ra ngoài form và luôn hiển thị */}
        <DialogFooter className="mt-6">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button type="submit" form="campaign-form" disabled={isLoading || !name.trim()}>
            {isLoading ? (
              <>
                <Spinner className="mr-2" />
                Đang lưu...
              </>
            ) : isEditing ? (
              "Cập nhật"
            ) : (
              "Tạo chiến dịch"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
