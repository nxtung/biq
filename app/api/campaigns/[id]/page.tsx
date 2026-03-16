"use client"

import { useParams } from "next/navigation"
import useSWR from "swr"
import { Campaign, CampaignSource } from "@/lib/db/schema"
import { PageHeader, PageHeaderDescription, PageHeaderHeading } from "@/components/ui/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface CampaignWithStats extends Campaign {
  sources: CampaignSource[]
  stats: {
    totalClicks: number
    totalInstalls: number
    conversionRate: number
  }
}

function CampaignSourcesTable({ sources }: { sources: CampaignSource[] }) {
  if (!sources || sources.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nguồn tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Chưa có nguồn tracking nào cho chiến dịch này.</p>
        </CardContent>
      </Card>
    )
  }

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success("Đã sao chép link tracking!")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nguồn tracking</CardTitle>
        <CardDescription>Danh sách các nguồn tracking cho chiến dịch này.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên nguồn</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Link tracking</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.map((source) => (
              <TableRow key={source.id}>
                <TableCell className="font-medium">{source.sourceName}</TableCell>
                <TableCell><Badge variant="secondary">{source.sourceType}</Badge></TableCell>
                <TableCell className="text-muted-foreground text-sm truncate max-w-xs">{source.trackingUrl}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleCopy(source.trackingUrl)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default function CampaignDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { data: campaign, isLoading, error } = useSWR<CampaignWithStats>(id ? `/api/campaigns/${id}` : null, fetcher)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-5 w-3/4" />
        </div>
        <div className="flex space-x-4 border-b">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold">Không tìm thấy chiến dịch</h2>
        <p className="text-muted-foreground">Chiến dịch bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
      </div>
    )
  }

  const statusVariant = {
    active: "default",
    paused: "secondary",
    ended: "destructive",
  } as const

  return (
    <div className="space-y-6">
      <PageHeader>
        <div className="flex items-center gap-4">
          <PageHeaderHeading>{campaign.name}</PageHeaderHeading>
          <Badge variant={statusVariant[campaign.status]}>{campaign.status}</Badge>
        </div>
        <PageHeaderDescription>{campaign.description || "Chưa có mô tả cho chiến dịch này."}</PageHeaderDescription>
      </PageHeader>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="sources">Nguồn</TabsTrigger>
          <TabsTrigger value="analytics" disabled>Phân tích</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6 space-y-6">
          <Card>
            <CardHeader><CardTitle>Thông tin chi tiết</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium">ID:</span> <code className="text-muted-foreground">{campaign.id}</code></div>
              <div><span className="font-medium">Ngày tạo:</span> <span className="text-muted-foreground">{format(new Date(campaign.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}</span></div>
              <div><span className="font-medium">Link iOS:</span> <a href={campaign.iosLink || '#'} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{campaign.iosLink || "Chưa có"}</a></div>
              <div><span className="font-medium">Link Android:</span> <a href={campaign.androidLink || '#'} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{campaign.androidLink || "Chưa có"}</a></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Hiệu suất</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/50"><p className="text-sm text-muted-foreground">Lượt click</p><p className="text-3xl font-bold">{campaign.stats.totalClicks.toLocaleString('vi-VN')}</p></div>
              <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/50"><p className="text-sm text-muted-foreground">Lượt cài đặt</p><p className="text-3xl font-bold">{campaign.stats.totalInstalls.toLocaleString('vi-VN')}</p></div>
              <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/50"><p className="text-sm text-muted-foreground">Tỷ lệ chuyển đổi</p><p className="text-3xl font-bold">{campaign.stats.conversionRate.toFixed(1)}%</p></div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sources" className="mt-6">
          <CampaignSourcesTable sources={campaign.sources} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
