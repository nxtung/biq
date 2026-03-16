"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Spinner } from "./ui/spinner"

interface DeleteCampaignDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  campaignName: string
  isLoading?: boolean
}

export function DeleteCampaignDialog({
  open,
  onClose,
  onConfirm,
  campaignName,
  isLoading,
}: DeleteCampaignDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={() => !isLoading && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
          <AlertDialogDescription>
            Hành động này không thể hoàn tác. Thao tác này sẽ xóa vĩnh viễn chiến dịch{" "}
            <span className="font-bold text-foreground">{campaignName}</span> và tất cả dữ liệu liên quan (nguồn, click, cài đặt).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isLoading}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading && <Spinner className="mr-2 h-4 w-4" />}
            {isLoading ? "Đang xóa..." : "Xóa"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}