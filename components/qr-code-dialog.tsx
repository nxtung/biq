"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Download } from "lucide-react"
import Image from "next/image"

interface QRCodeDialogProps {
  open: boolean
  onClose: () => void
  sourceName: string
  qrCodeUrl: string
}

export function QRCodeDialog({ open, onClose, sourceName, qrCodeUrl }: QRCodeDialogProps) {
  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = qrCodeUrl
    link.download = `qr-code-${sourceName.replace(/\s+/g, "-").toLowerCase()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Mã QR cho nguồn</DialogTitle>
          <DialogDescription>{sourceName}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center p-4 bg-white rounded-md">
          {qrCodeUrl && <Image src={qrCodeUrl} alt={`QR Code for ${sourceName}`} width={250} height={250} />}
        </div>
        <DialogFooter>
          <Button onClick={handleDownload} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Tải xuống
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}