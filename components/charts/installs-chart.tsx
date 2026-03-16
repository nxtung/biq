"use client"

import useSWR from "swr"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface InstallData {
  date: string
  installs: number
  clicks: number
}

export function InstallsChart() {
  const { data, isLoading } = useSWR<{ data: InstallData[] }>(
    "/api/analytics/installs-timeline",
    fetcher
  )

  if (isLoading) {
    return <Skeleton className="h-full w-full bg-muted" />
  }

  const chartData = data?.data || []

  if (chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Chưa có dữ liệu
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorInstalls" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
        />
        <Area
          type="monotone"
          dataKey="clicks"
          stroke="hsl(var(--chart-2))"
          fillOpacity={1}
          fill="url(#colorClicks)"
          name="Clicks"
        />
        <Area
          type="monotone"
          dataKey="installs"
          stroke="hsl(var(--chart-1))"
          fillOpacity={1}
          fill="url(#colorInstalls)"
          name="Cài đặt"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
