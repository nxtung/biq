"use client"

import useSWR from "swr"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface SourceData {
  source: string
  installs: number
}

export function SourceChart() {
  const { data, isLoading } = useSWR<{ data: SourceData[] }>(
    "/api/analytics/source-distribution",
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
      <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 10, left: 60, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
        <XAxis 
          type="number"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
        />
        <YAxis 
          type="category"
          dataKey="source"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
          width={60}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
          formatter={(value: number) => [value.toLocaleString("vi-VN"), "Cài đặt"]}
        />
        <Bar 
          dataKey="installs" 
          fill="hsl(var(--chart-1))" 
          radius={[0, 4, 4, 0]}
          name="Cài đặt"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
