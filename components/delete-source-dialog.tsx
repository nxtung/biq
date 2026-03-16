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
import { Spinner } from "@/components/ui/spinner"

interface DeleteSourceDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  sourceName: string
  isLoading?: boolean
}

export function DeleteSourceDialog({
  open,
  onClose,
  onConfirm,
  sourceName,
  isLoading,
}: DeleteSourceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => !isLoading && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Xác nhận xóa nguồn</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa nguồn{" "}<span className="font-bold text-foreground">{sourceName}</span>? Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Hủy</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>{isLoading && <Spinner className="mr-2" />}Xóa</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}