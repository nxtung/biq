"use client"

import Image from "next/image"
import { useState } from "react"
import { useParams } from "next/navigation"
import useSWR from "swr"
import { Campaign, CampaignSource, Click, Install, InstallToken } from "@/lib/db/schema"
import { PageHeader, PageHeaderDescription, PageHeaderHeading } from "@/components/ui/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Copy, MoreHorizontal, Pencil, Plus, QrCode, Trash2, Eye } from "lucide-react"
import { toast } from "sonner"
import { isValid, parseISO } from 'date-fns';
import { SourceDialog } from "@/components/source-dialog"
import { DeleteSourceDialog } from "@/components/delete-source-dialog"
import { QRCodeDialog } from "@/components/qr-code-dialog"
import { ClickDetailDialog } from "@/components/click-detail-dialog"
import { InstallDetailDialog } from "@/components/install-detail-dialog"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface ClickWithSource extends Click {
  source: CampaignSource | null;
}

interface InstallWithDetails extends Install {
  source: CampaignSource | null;
  installToken: (InstallToken & {
    click?: Click;
  }) | null;
}

interface CampaignWithStats extends Campaign {
  sources: CampaignSource[]
  clicks: ClickWithSource[]
  installs: InstallWithDetails[]
  stats: {
    totalClicks: number
    totalInstalls: number
    conversionRate: number
  }
}

// Utility function to safely format dates (moved from previous turn's suggestion)
function formatSafeDate(dateInput: Date | string | null | undefined, formatStr: string): string {
  if (dateInput === null || dateInput === undefined) {
    return 'N/A'; // Or any other placeholder string you prefer
  }

  let date: Date;
  if (typeof dateInput === 'string') {
    date = parseISO(dateInput);
  } else {
    date = dateInput;
  }
  return isValid(date) ? format(date, formatStr, { locale: vi }) : 'Invalid Date';
}

interface CampaignSourcesTableProps {
  sources: CampaignSource[]
  onAdd: () => void
  onEdit: (source: CampaignSource) => void
  onDelete: (source: CampaignSource) => void
  onViewQR: (source: CampaignSource) => void
}

function CampaignSourcesTable({ sources, onAdd, onEdit, onDelete, onViewQR }: CampaignSourcesTableProps) {
  if (!sources || sources.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nguồn tracking</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <p className="text-sm text-muted-foreground">Chưa có nguồn tracking nào cho chiến dịch này.</p>
          <Button onClick={onAdd} variant="outline" className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Tạo nguồn đầu tiên
          </Button>
        </CardContent>
      </Card>
    )
  }

  const handleCopy = (url: string) => {
    // API Clipboard hiện đại chỉ hoạt động trong bối cảnh an toàn (HTTPS) hoặc localhost.
    // Khi test trên mobile qua mạng LAN (HTTP), nó sẽ là `undefined`.
    if (navigator.clipboard && window.isSecureContext) {
      // Cách hiện đại, an toàn
      navigator.clipboard.writeText(url).then(() => {
        toast.success("Đã sao chép link tracking!");
      }).catch(err => {
        console.error('Không thể sao chép: ', err);
        toast.error("Không thể sao chép tự động.");
      });
    } else {
      // Fallback cho trình duyệt cũ hoặc bối cảnh không an toàn
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.top = "-9999px";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success("Đã sao chép link tracking!");
      } catch (err) {
        toast.error("Không thể sao chép tự động.");
      }
      document.body.removeChild(textArea);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Nguồn tracking</CardTitle>
          <CardDescription>Danh sách các nguồn tracking cho chiến dịch này.</CardDescription>
        </div>
        <Button onClick={onAdd}><Plus className="mr-2 h-4 w-4" /> Thêm nguồn</Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên nguồn</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Link tracking</TableHead>
              <TableHead>Mã QR</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.map((source) => (
              <TableRow key={source.id}>
                <TableCell className="font-medium">{source.sourceName}</TableCell>
                <TableCell><Badge variant="secondary">{source.sourceType}</Badge></TableCell>
                <TableCell className="text-muted-foreground text-sm truncate max-w-xs">{source.trackingUrl}</TableCell>
                <TableCell>
                  {source.qrCodeUrl && (
                    <div
                      className="cursor-pointer p-1 bg-white rounded-sm inline-block hover:ring-2 hover:ring-primary transition-all"
                      onClick={() => onViewQR(source)}
                      title="Xem mã QR"
                    >
                      <Image src={source.qrCodeUrl} alt={`QR for ${source.sourceName}`} width={40} height={40} />
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(source)}>
                        <Pencil className="mr-2 h-4 w-4" /> Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCopy(source.trackingUrl)}>
                        <Copy className="mr-2 h-4 w-4" /> Sao chép link
                      </DropdownMenuItem>
                      {source.qrCodeUrl && (
                        <DropdownMenuItem onClick={() => onViewQR(source)}>
                          <QrCode className="mr-2 h-4 w-4" /> Xem mã QR
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onDelete(source)} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

interface ClicksTableProps {
  clicks: ClickWithSource[];
  onViewDetail: (click: ClickWithSource) => void;
}

function ClicksTable({ clicks, onViewDetail }: ClicksTableProps) {
  if (!clicks || clicks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Danh sách lượt click</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <p className="text-sm text-muted-foreground">Chưa có lượt click nào được ghi nhận.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Danh sách lượt click</CardTitle>
        <CardDescription>Tổng cộng {clicks.length.toLocaleString('vi-VN')} lượt click.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thời gian</TableHead>
              <TableHead>Nguồn</TableHead>
              <TableHead>Loại thiết bị</TableHead>
              <TableHead>Địa chỉ IP</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clicks.map((click) => (
              <TableRow key={click.id}>
                <TableCell>{format(new Date(click.clickedAt), "dd/MM/yy HH:mm:ss", { locale: vi })}</TableCell>
                <TableCell>{click.source?.sourceName || 'N/A'}</TableCell>
                <TableCell><Badge variant="outline">{click.deviceType || 'N/A'}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{click.ipAddress}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => onViewDetail(click)} title="Xem chi tiết">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

interface InstallsTableProps {
  installs: InstallWithDetails[];
  onViewDetail: (install: InstallWithDetails) => void;
}

function InstallsTable({ installs, onViewDetail }: InstallsTableProps) {
  if (!installs || installs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Danh sách lượt cài đặt</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <p className="text-sm text-muted-foreground">Chưa có lượt cài đặt nào được ghi nhận.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Danh sách lượt cài đặt</CardTitle>
        <CardDescription>Tổng cộng {installs.length.toLocaleString('vi-VN')} lượt cài đặt.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thời gian</TableHead>
              <TableHead>Nguồn</TableHead>
              <TableHead>Loại thiết bị</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {installs.map((install) => (
              <TableRow key={install.id}>
                <TableCell>{format(new Date(install.installedAt), "dd/MM/yy HH:mm:ss", { locale: vi })}</TableCell>
                <TableCell>{install.source?.sourceName || 'N/A'}</TableCell>
                <TableCell><Badge variant="outline">{install.deviceType || 'N/A'}</Badge></TableCell>
                <TableCell>{install.matched ? <Badge>Đã ghi nhận</Badge> : <Badge variant="secondary">Chờ xử lý</Badge>}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => onViewDetail(install)} title="Xem chi tiết">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function CampaignDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { data: campaign, isLoading, error, mutate } = useSWR<CampaignWithStats>(id ? `/api/campaigns/${id}` : null, fetcher)

  const [sourceDialogOpen, setSourceDialogOpen] = useState(false)
  const [editingSource, setEditingSource] = useState<CampaignSource | null>(null)
  const [deletingSource, setDeletingSource] = useState<CampaignSource | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [viewingQRCode, setViewingQRCode] = useState<CampaignSource | null>(null)
  const [viewingClick, setViewingClick] = useState<ClickWithSource | null>(null)
  const [viewingInstall, setViewingInstall] = useState<InstallWithDetails | null>(null)


  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-1/2 bg-muted" />
          <Skeleton className="h-5 w-3/4 bg-muted" />
        </div>
        <div className="flex space-x-4 border-b">
          <Skeleton className="h-10 w-24 bg-muted" />
          <Skeleton className="h-10 w-24 bg-muted" />
        </div>
        <Skeleton className="h-64 w-full bg-muted" />
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

  const handleAddSource = () => {
    setEditingSource(null)
    setSourceDialogOpen(true)
  }

  const handleEditSource = (source: CampaignSource) => {
    setEditingSource(source)
    setSourceDialogOpen(true)
  }

  const handleSourceDialogClose = () => {
    setSourceDialogOpen(false)
    setEditingSource(null)
    mutate() // Tải lại dữ liệu chiến dịch để hiển thị nguồn mới/đã cập nhật
  }

  const handleDeleteSourceConfirm = async () => {
    if (!deletingSource) return
    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/campaigns/${id}/sources/${deletingSource.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success("Đã xóa nguồn")
        mutate()
      } else {
        const data = await res.json()
        toast.error(data.error || "Không thể xóa nguồn")
      }
    } catch {
      toast.error("Đã xảy ra lỗi")
    }

    setIsSubmitting(false)
    setDeletingSource(null)
  }

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
          <TabsTrigger value="clicks">Clicks</TabsTrigger>
          <TabsTrigger value="installs">Installs</TabsTrigger>
          <TabsTrigger value="analytics" disabled>Phân tích</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6 space-y-6">
          <Card>
            <CardHeader><CardTitle>Thông tin chi tiết</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium">ID:</span> <code className="text-muted-foreground">{campaign.id}</code></div>
              <div><span className="font-medium">Ngày tạo:</span> <span className="text-muted-foreground">{formatSafeDate(campaign.createdAt, "dd/MM/yyyy HH:mm")}</span></div>
              <div><span className="font-medium">Link iOS:</span> <a href={campaign.iosLink || '#'} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{campaign.iosLink || "Chưa có"}</a></div>
              <div><span className="font-medium">Link Android:</span> <a href={campaign.androidLink || '#'} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{campaign.androidLink || "Chưa có"}</a></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Hiệu suất</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/50"><p className="text-sm text-muted-foreground">Lượt click</p><p className="text-3xl font-bold">{(campaign.stats?.totalClicks ?? 0).toLocaleString('vi-VN')}</p></div>
              <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/50"><p className="text-sm text-muted-foreground">Lượt cài đặt</p><p className="text-3xl font-bold">{(campaign.stats?.totalInstalls ?? 0).toLocaleString('vi-VN')}</p></div>
              <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/50"><p className="text-sm text-muted-foreground">Tỷ lệ chuyển đổi</p><p className="text-3xl font-bold">{(campaign.stats?.conversionRate ?? 0).toFixed(1)}%</p></div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sources" className="mt-6">
          <CampaignSourcesTable
            sources={campaign.sources}
            onAdd={handleAddSource}
            onEdit={handleEditSource}
            onDelete={(source) => setDeletingSource(source)}
            onViewQR={(source) => setViewingQRCode(source)}
          />
        </TabsContent>
        <TabsContent value="clicks" className="mt-6">
          <ClicksTable clicks={campaign.clicks} onViewDetail={(click) => setViewingClick(click)} />
        </TabsContent>
        <TabsContent value="installs" className="mt-6">
          <InstallsTable installs={campaign.installs} onViewDetail={(install) => setViewingInstall(install)} />
        </TabsContent>
      </Tabs>

      <SourceDialog
        open={sourceDialogOpen}
        onClose={handleSourceDialogClose}
        campaignId={id}
        source={editingSource}
      />

      <DeleteSourceDialog
        open={!!deletingSource}
        onClose={() => setDeletingSource(null)}
        onConfirm={handleDeleteSourceConfirm}
        sourceName={deletingSource?.sourceName || ""}
        isLoading={isSubmitting}
      />

      {viewingQRCode && (
        <QRCodeDialog
          open={!!viewingQRCode}
          onClose={() => setViewingQRCode(null)}
          sourceName={viewingQRCode.sourceName}
          qrCodeUrl={viewingQRCode.qrCodeUrl || ""}
        />
      )}

      <ClickDetailDialog
        open={!!viewingClick}
        onClose={() => setViewingClick(null)}
        click={viewingClick}
      />

      <InstallDetailDialog
        open={!!viewingInstall}
        onClose={() => setViewingInstall(null)}
        install={viewingInstall}
      />
    </div>
  )
}