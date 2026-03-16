"use client"

import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Eye, Link2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { CampaignDialog } from "@/components/campaign-dialog"
import { DeleteCampaignDialog } from "@/components/delete-campaign-dialog"
import Link from "next/link"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Campaign {
  id: string
  name: string
  description: string | null
  eventType: string | null
  promotion: string | null
  status: "active" | "paused" | "ended"
  sourcesCount: number
  clicksCount: number
  installsCount: number
  createdAt: string
  iosLink: string | null
  androidLink: string | null
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  active: { label: "Hoạt động", variant: "default" },
  paused: { label: "Tạm dừng", variant: "secondary" },
  ended: { label: "Kết thúc", variant: "destructive" },
}

export default function CampaignsPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const { data, isLoading, mutate } = useSWR<{ campaigns: Campaign[] }>(
    `/api/campaigns?search=${search}`,
    fetcher
  )

  const campaigns = data?.campaigns || []
  const canCreate = user?.role === "admin" || user?.role === "marketing"
  const canDelete = user?.role === "admin"

  const handleCreateNew = () => {
    setEditingCampaign(null)
    setDialogOpen(true)
  }

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign)
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingCampaign(null)
    mutate()
  }

  const handleDeleteConfirm = async () => {
    if (!deletingCampaign) return
    setIsDeleting(true)

    try {
      const res = await fetch(`/api/campaigns/${deletingCampaign.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success("Đã xóa chiến dịch")
        setDeletingCampaign(null)
        mutate()
      } else {
        const data = await res.json()
        toast.error(data.error || "Không thể xóa chiến dịch")
      }
    } catch {
      toast.error("Đã xảy ra lỗi")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Chiến dịch</h2>
          <p className="text-muted-foreground">
            Quản lý các chiến dịch marketing của bạn
          </p>
        </div>
        {canCreate && (
          <Button onClick={handleCreateNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Tạo chiến dịch
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm chiến dịch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full bg-muted" />
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {search ? "Không tìm thấy chiến dịch nào" : "Chưa có chiến dịch nào"}
              </p>
              {canCreate && !search && (
                <Button onClick={handleCreateNew} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Tạo chiến dịch đầu tiên
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên chiến dịch</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Nguồn</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Cài đặt</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => {
                    const status = statusLabels[campaign.status]
                    return (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{campaign.name}</p>
                            {campaign.eventType && (
                              <p className="text-sm text-muted-foreground">
                                {campaign.eventType}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {campaign.sourcesCount}
                        </TableCell>
                        <TableCell className="text-right">
                          {campaign.clicksCount.toLocaleString("vi-VN")}
                        </TableCell>
                        <TableCell className="text-right">
                          {campaign.installsCount.toLocaleString("vi-VN")}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/campaigns/${campaign.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Xem chi tiết
                                </Link>
                              </DropdownMenuItem>
                              {canCreate && (
                                <DropdownMenuItem onClick={() => handleEdit(campaign)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Chỉnh sửa
                                </DropdownMenuItem>
                              )}
                              {canDelete && (
                                <DropdownMenuItem
                                  onClick={() => setDeletingCampaign(campaign)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Xóa
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CampaignDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        campaign={editingCampaign}
      />

      <DeleteCampaignDialog
        open={!!deletingCampaign}
        onClose={() => !isDeleting && setDeletingCampaign(null)}
        onConfirm={handleDeleteConfirm}
        campaignName={deletingCampaign?.name || ""}
        isLoading={isDeleting}
      />
    </div>
  )
}
