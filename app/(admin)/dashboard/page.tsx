"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import useSWR from "swr"
import { BarChart3, Users, MousePointerClick, Smartphone } from "lucide-react"
import { InstallsChart } from "@/components/charts/installs-chart"
import { DeviceChart } from "@/components/charts/device-chart"
import { SourceChart } from "@/components/charts/source-chart"
import { VietnamMap } from "@/components/charts/vietnam-map"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface DashboardStats {
  totalCampaigns: number
  totalClicks: number
  totalInstalls: number
  conversionRate: number
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  loading,
}: {
  title: string
  value: string | number
  description?: string
  icon: React.ElementType
  loading?: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24 bg-muted" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { data, isLoading } = useSWR<{ stats: DashboardStats }>(
    "/api/analytics/stats",
    fetcher
  )

  const stats = data?.stats

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Tổng quan về hoạt động chiến dịch marketing
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tổng chiến dịch"
          value={stats?.totalCampaigns ?? 0}
          description="Chiến dịch đang hoạt động"
          icon={BarChart3}
          loading={isLoading}
        />
        <StatCard
          title="Lượt click"
          value={stats?.totalClicks?.toLocaleString("vi-VN") ?? 0}
          description="Tổng số lượt click"
          icon={MousePointerClick}
          loading={isLoading}
        />
        <StatCard
          title="Lượt cài đặt"
          value={stats?.totalInstalls?.toLocaleString("vi-VN") ?? 0}
          description="Tổng số lượt cài đặt"
          icon={Smartphone}
          loading={isLoading}
        />
        <StatCard
          title="Tỷ lệ chuyển đổi"
          value={`${stats?.conversionRate?.toFixed(1) ?? 0}%`}
          description="Click → Install"
          icon={Users}
          loading={isLoading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Lượt cài đặt theo thời gian</CardTitle>
            <CardDescription>Biểu đồ cài đặt trong 30 ngày qua</CardDescription>
          </CardHeader>
          <CardContent className="pl-2 h-[300px]">
            <InstallsChart />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Phân bố thiết bị</CardTitle>
            <CardDescription>iOS vs Android</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <DeviceChart />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Phân bố nguồn</CardTitle>
            <CardDescription>Cài đặt theo nguồn marketing</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <SourceChart />
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Phân bố theo địa lý</CardTitle>
            <CardDescription>Phân bố người dùng theo tỉnh thành</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] p-0 overflow-hidden">
            <VietnamMap />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
