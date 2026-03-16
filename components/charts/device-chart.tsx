"use client"

import useSWR from "swr"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface DeviceData {
  name: string
  value: number
  color: string
}

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))"]

export function DeviceChart() {
  const { data, isLoading } = useSWR<{ data: DeviceData[] }>(
    "/api/analytics/device-distribution",
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
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          fill="#8884d8"
          paddingAngle={5}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
          formatter={(value: number) => [value.toLocaleString("vi-VN"), "Cài đặt"]}
        />
        <Legend 
          verticalAlign="bottom" 
          height={36}
          formatter={(value) => <span className="text-foreground">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
