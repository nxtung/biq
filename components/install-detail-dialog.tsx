"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Install, CampaignSource, InstallToken } from "@/lib/db/schema"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "./ui/badge"

interface InstallWithDetails extends Install {
  source: CampaignSource | null
  installToken: (InstallToken & { click?: any }) | null // `click` sẽ được thêm sau
}

interface InstallDetailDialogProps {
  open: boolean
  onClose: () => void
  install: InstallWithDetails | null
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

export function InstallDetailDialog({ open, onClose, install }: InstallDetailDialogProps) {
  if (!install) return null

  let deviceInfo = null;
  try {
    deviceInfo = install.deviceInfo ? JSON.parse(install.deviceInfo) : null;
  } catch (e) {
    console.error("Failed to parse deviceInfo JSON", e);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chi tiết lượt cài đặt</DialogTitle>
          <DialogDescription>
            Thông tin chi tiết về lượt cài đặt ID: <code className="text-xs">{install.id}</code>
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <dl className="space-y-2">
            <DetailItem label="Thời gian" value={format(new Date(install.installedAt), "dd/MM/yyyy HH:mm:ss", { locale: vi })} />
            <DetailItem label="Nguồn" value={install.source?.sourceName || 'Không rõ'} />
            <DetailItem label="Loại thiết bị" value={<Badge variant="secondary">{install.deviceType}</Badge>} />
            <DetailItem label="Click ID liên quan" value={<code className="text-xs">{install.installToken?.clickId || 'N/A'}</code>} />
          </dl>
          {deviceInfo && (
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Thông tin thiết bị (từ App)</h4>
              <pre className="p-4 bg-muted rounded-md text-xs overflow-x-auto">
                {JSON.stringify(deviceInfo, null, 2)}
              </pre>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}