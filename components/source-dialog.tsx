"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { CampaignSource } from "@/lib/db/schema"

const sourceTypes = {
  facebook: "Facebook",
  zalo: "Zalo",
  message: "Tin nhắn",
  youtube: "Youtube",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  qr: "Mã QR",
  post: "Bài viết",
  news: "Báo chí",
  partner_app: "App đối tác",
  partner_website: "Website đối tác",
  refer_code: "Mã giới thiệu",
  other: "Khác",
}

interface SourceDialogProps {
  open: boolean
  onClose: () => void
  campaignId: string
  source?: CampaignSource | null
}

export function SourceDialog({ open, onClose, campaignId, source }: SourceDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [sourceName, setSourceName] = useState("")
  const [sourceType, setSourceType] = useState("other")
  const [targetUrl, setTargetUrl] = useState("")

  const isEditing = !!source

  useEffect(() => {
    if (open) {
      if (source) {
        setSourceName(source.sourceName)
        setSourceType(source.sourceType)
        setTargetUrl(source.targetUrl || "")
      } else {
        setSourceName("")
        setSourceType("other")
        setTargetUrl("")
      }
    }
  }, [source, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = isEditing
        ? `/api/campaigns/${campaignId}/sources/${source.id}`
        : `/api/campaigns/${campaignId}/sources`
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceName,
          sourceType,
          targetUrl: targetUrl || null,
        }),
      })

      if (res.ok) {
        toast.success(isEditing ? "Đã cập nhật nguồn" : "Đã tạo nguồn")
        onClose()
      } else {
        const data = await res.json()
        toast.error(data.error || "Không thể lưu nguồn")
      }
    } catch {
      toast.error("Đã xảy ra lỗi")
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={() => !isLoading && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Chỉnh sửa nguồn" : "Tạo nguồn tracking mới"}
          </DialogTitle>
          <DialogDescription>
            Điền thông tin cho nguồn tracking của chiến dịch.
          </DialogDescription>
        </DialogHeader>

        <form id="source-form" onSubmit={handleSubmit} className="space-y-4 py-2">
          <Field>
            <FieldLabel htmlFor="sourceName">Tên nguồn *</FieldLabel>
            <Input id="sourceName" value={sourceName} onChange={(e) => setSourceName(e.target.value)} placeholder="VD: Quảng cáo Facebook tháng 5" required />
          </Field>

          <Field>
            <FieldLabel htmlFor="sourceType">Loại nguồn *</FieldLabel>
            <Select value={sourceType} onValueChange={setSourceType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(sourceTypes).map(([key, value]) => (<SelectItem key={key} value={key}>{value}</SelectItem>))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="targetUrl">Link đích (tùy chọn)</FieldLabel>
            <Input id="targetUrl" type="url" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="Link người dùng sẽ được chuyển đến" />
          </Field>
        </form>

        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Hủy</Button>
          <Button type="submit" form="source-form" disabled={isLoading || !sourceName.trim()}>
            {isLoading ? (<><Spinner className="mr-2" /> Đang lưu...</>) : isEditing ? "Cập nhật" : "Tạo nguồn"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}