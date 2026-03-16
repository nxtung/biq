"use client"

import { useState, memo } from "react"
import useSWR from "swr"
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface ProvinceData {
  province: string
  installs: number
}

// Vietnam GeoJSON URL
const geoUrl = "https://raw.githubusercontent.com/Vizzuality/growasia_calculator/refs/heads/master/public/vietnam.geojson"

const getColor = (value: number, max: number) => {
  if (value === 0) return "#f1f5f9"

  const intensity = value / max

  if (intensity < 0.2) return "#bbf7d0"
  if (intensity < 0.4) return "#86efac"
  if (intensity < 0.6) return "#4ade80"
  if (intensity < 0.8) return "#22c55e"

  return "#16a34a"
}

function VietnamMapComponent() {
  const { data, isLoading } = useSWR<{ data: ProvinceData[] }>(
    "/api/analytics/province-distribution",
    fetcher
  )
  const [tooltipContent, setTooltipContent] = useState("")

  if (isLoading) {
    return <Skeleton className="h-full w-full bg-muted" />
  }

  const provinceData = data?.data || []
  const maxInstalls = Math.max(...provinceData.map((p) => p.installs), 1)

  const getProvinceInstalls = (provinceName: string): number => {
    const province = provinceData.find(
      (p) => p.province.toLowerCase() === provinceName.toLowerCase() ||
             provinceName.toLowerCase().includes(p.province.toLowerCase())
    )
    return province?.installs || 0
  }

  return (
    <TooltipProvider>
      <div className="h-full w-full relative">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 2000,
            center: [107, 16],
          }}
          style={{ width: "100%", height: "100%" }}
        >
          <ZoomableGroup center={[107, 16]} zoom={1}>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const provinceName = geo.properties.Name || geo.properties.name || ""
                  const installs = getProvinceInstalls(provinceName)
                  
                  return (
                    <Tooltip key={geo.rsmKey}>
                      <TooltipTrigger asChild>
                        <Geography
                          geography={geo}
                          onMouseEnter={() => {
                            setTooltipContent(`${provinceName}: ${installs.toLocaleString("vi-VN")} cài đặt`)
                          }}
                          onMouseLeave={() => {
                            setTooltipContent("")
                          }}
                          style={{
                            default: {
                              fill: getColor(installs, maxInstalls),
                              stroke: "hsl(var(--border))",
                              strokeWidth: 0.5,
                              outline: "none",
                            },
                            hover: {
                              fill: "hsl(var(--chart-1))",
                              stroke: "hsl(var(--border))",
                              strokeWidth: 1,
                              outline: "none",
                              cursor: "pointer",
                            },
                            pressed: {
                              fill: "hsl(var(--chart-1))",
                              outline: "none",
                            },
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{tooltipContent || `${provinceName}: ${installs.toLocaleString("vi-VN")} cài đặt`}</p>
                      </TooltipContent>
                    </Tooltip>
                  )
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
        
        {/* Legend */}
        <div className="absolute bottom-2 right-2 bg-card/80 backdrop-blur-sm p-2 rounded-lg text-xs">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(145, 60%, 45%)" }} />
            <span>Cao</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-muted" />
            <span>Thấp</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

export const VietnamMap = memo(VietnamMapComponent)
