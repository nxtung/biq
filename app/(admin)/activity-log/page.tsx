"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Filter, Download, Activity, User, Settings, MousePointerClick, Smartphone } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

const fetcher = (url: string) => fetch(url).then(res => res.json())

const actionIcons: Record<string, React.ReactNode> = {
  login: <User className="h-4 w-4" />,
  logout: <User className="h-4 w-4" />,
  create_campaign: <Activity className="h-4 w-4" />,
  update_campaign: <Activity className="h-4 w-4" />,
  delete_campaign: <Activity className="h-4 w-4" />,
  create_source: <MousePointerClick className="h-4 w-4" />,
  update_source: <MousePointerClick className="h-4 w-4" />,
  delete_source: <MousePointerClick className="h-4 w-4" />,
  click: <MousePointerClick className="h-4 w-4" />,
  install: <Smartphone className="h-4 w-4" />,
  settings_update: <Settings className="h-4 w-4" />,
}

const actionLabels: Record<string, string> = {
  login: "Đăng nhập",
  logout: "Đăng xuất",
  create_campaign: "Tạo chiến dịch",
  update_campaign: "Cập nhật chiến dịch",
  delete_campaign: "Xóa chiến dịch",
  create_source: "Tạo nguồn",
  update_source: "Cập nhật nguồn",
  delete_source: "Xóa nguồn",
  click: "Click tracking",
  install: "Cài đặt app",
  settings_update: "Cập nhật cài đặt",
}

const actionColors: Record<string, string> = {
  login: "bg-blue-500/10 text-blue-600",
  logout: "bg-gray-500/10 text-gray-600",
  create_campaign: "bg-green-500/10 text-green-600",
  update_campaign: "bg-yellow-500/10 text-yellow-600",
  delete_campaign: "bg-red-500/10 text-red-600",
  create_source: "bg-green-500/10 text-green-600",
  update_source: "bg-yellow-500/10 text-yellow-600",
  delete_source: "bg-red-500/10 text-red-600",
  click: "bg-purple-500/10 text-purple-600",
  install: "bg-accent/10 text-accent",
  settings_update: "bg-blue-500/10 text-blue-600",
}

interface ActivityLog {
  id: string
  action: string
  entityType: string | null
  entityId: string | null
  userId: string | null
  userName: string | null
  details: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

export default function ActivityPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const limit = 20

  const { data, isLoading } = useSWR<{ logs: ActivityLog[]; total: number }>(
    `/api/activity?page=${page}&limit=${limit}&action=${actionFilter}&search=${searchQuery}`,
    fetcher
  )

  const logs = data?.logs || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{"Nhật ký hoạt động"}</h1>
        <p className="text-muted-foreground">{"Theo dõi tất cả hoạt động trong hệ thống"}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div>
              <CardTitle>{"Lịch sử hoạt động"}</CardTitle>
              <CardDescription>
                {"Tổng cộng"} {total} {"hoạt động được ghi nhận"}
              </CardDescription>
            </div>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              {"Xuất báo cáo"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo người dùng, IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Lọc theo hành động" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{"Tất cả hành động"}</SelectItem>
                <SelectItem value="login">{"Đăng nhập"}</SelectItem>
                <SelectItem value="logout">{"Đăng xuất"}</SelectItem>
                <SelectItem value="create_campaign">{"Tạo chiến dịch"}</SelectItem>
                <SelectItem value="click">{"Click tracking"}</SelectItem>
                <SelectItem value="install">{"Cài đặt app"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{"Hành động"}</TableHead>
                  <TableHead>{"Người dùng"}</TableHead>
                  <TableHead>{"Đối tượng"}</TableHead>
                  <TableHead>{"IP"}</TableHead>
                  <TableHead>{"Thời gian"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-6 w-32 bg-muted" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 bg-muted" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 bg-muted" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-28 bg-muted" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-36 bg-muted" /></TableCell>
                    </TableRow>
                  ))
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {"Chưa có hoạt động nào được ghi nhận"}
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-md ${actionColors[log.action] || "bg-muted"}`}>
                            {actionIcons[log.action] || <Activity className="h-4 w-4" />}
                          </div>
                          <span className="font-medium">{actionLabels[log.action] || log.action}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.userName ? (
                          <Badge variant="secondary">{log.userName}</Badge>
                        ) : (
                          <span className="text-muted-foreground">{"Ẩn danh"}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.entityType && log.entityId ? (
                          <span className="text-sm">
                            {log.entityType}: {log.entityId.slice(0, 8)}...
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {log.ipAddress || "N/A"}
                        </code>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: vi })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                {"Trang"} {page} / {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  {"Trước"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  {"Sau"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
