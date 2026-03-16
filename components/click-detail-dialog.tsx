"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Click, CampaignSource } from "@/lib/db/schema"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ClickWithSource extends Click {
  source: CampaignSource | null
}

interface ClickDetailDialogProps {
  open: boolean
  onClose: () => void
  click: ClickWithSource | null
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null
  return (
    <div className="grid grid-cols-3 gap-2 py-2 border-b">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-sm text-foreground break-words">{value}</dd>
    </div>
  )
}

export function ClickDetailDialog({ open, onClose, click }: ClickDetailDialogProps) {
  if (!click) return null

  let fingerprintData = null;
  try {
    fingerprintData = click.fingerprintData ? JSON.parse(click.fingerprintData) : null;
  } catch (e) {
    console.error("Failed to parse fingerprintData JSON", e);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chi tiết lượt click</DialogTitle>
          <DialogDescription>
            Thông tin chi tiết về lượt click ID: <code className="text-xs">{click.id}</code>
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <dl className="space-y-2">
            <DetailItem label="Thời gian" value={format(new Date(click.clickedAt), "dd/MM/yyyy HH:mm:ss", { locale: vi })} />
            <DetailItem label="Nguồn" value={click.source?.sourceName || 'Không rõ'} />
            <DetailItem label="Loại thiết bị" value={click.deviceType} />
            <DetailItem label="Địa chỉ IP" value={click.ipAddress} />
            <DetailItem label="User Agent" value={click.userAgent} />
            <DetailItem label="Fingerprint ID" value={click.fingerprint} />
          </dl>
          {fingerprintData && (
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Dữ liệu Fingerprint</h4>
              <pre className="p-4 bg-muted rounded-md text-xs whitespace-pre-wrap break-all">
                {JSON.stringify(fingerprintData, null, 2)}
              </pre>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}