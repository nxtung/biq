"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

const screens = [
  {
    id: "dashboard",
    title: "Tổng quan",
    description: "Xem toàn bộ tài chính của bạn trong một màn hình",
  },
  {
    id: "analytics",
    title: "Phân tích",
    description: "Biểu đồ chi tiết về thu chi hàng tháng",
  },
  {
    id: "savings",
    title: "Tiết kiệm",
    description: "Theo dõi mục tiêu tiết kiệm của bạn",
  },
]

export function LandingScreenshots() {
  const [activeScreen, setActiveScreen] = useState("dashboard")

  return (
    <section id="screenshots" className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
            Giao diện thân thiện
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Thiết kế đơn giản, dễ sử dụng cho mọi đối tượng người dùng.
          </p>
        </div>

        {/* Screen selector */}
        <div className="flex justify-center gap-4 mb-12 flex-wrap">
          {screens.map((screen) => (
            <button
              key={screen.id}
              onClick={() => setActiveScreen(screen.id)}
              className={cn(
                "px-6 py-3 rounded-full text-sm font-medium transition-all",
                activeScreen === screen.id
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {screen.title}
            </button>
          ))}
        </div>

        {/* Phone mockups */}
        <div className="flex justify-center items-center gap-8">
          {/* Main phone */}
          <div className="relative w-64 md:w-80">
            <div className="relative bg-foreground rounded-[3rem] p-2 shadow-2xl">
              <div className="bg-background rounded-[2.5rem] overflow-hidden aspect-[9/19]">
                {/* Dynamic screen content */}
                <div className="h-full w-full bg-gradient-to-br from-muted to-background p-6 flex flex-col">
                  {/* Status bar */}
                  <div className="flex justify-between items-center text-xs text-muted-foreground mb-6">
                    <span>9:41</span>
                    <div className="flex gap-1">
                      <div className="w-4 h-2 bg-foreground rounded-sm" />
                    </div>
                  </div>

                  {activeScreen === "dashboard" && (
                    <>
                      <div className="mb-6">
                        <p className="text-xs text-muted-foreground mb-1">Xin chào, Minh</p>
                        <p className="text-lg font-semibold">Tổng quan tài chính</p>
                      </div>
                      <div className="bg-card rounded-2xl p-4 shadow-sm border mb-4">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs text-muted-foreground">Số dư khả dụng</span>
                          <span className="text-xs text-accent">+12%</span>
                        </div>
                        <p className="text-2xl font-bold">25.800.000 đ</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-muted/50 rounded-xl p-3">
                          <p className="text-xs text-muted-foreground mb-1">Thu nhập</p>
                          <p className="text-sm font-semibold text-accent">+15.000.000</p>
                        </div>
                        <div className="bg-muted/50 rounded-xl p-3">
                          <p className="text-xs text-muted-foreground mb-1">Chi tiêu</p>
                          <p className="text-sm font-semibold">-8.200.000</p>
                        </div>
                      </div>
                    </>
                  )}

                  {activeScreen === "analytics" && (
                    <>
                      <div className="mb-6">
                        <p className="text-lg font-semibold">Phân tích chi tiêu</p>
                        <p className="text-xs text-muted-foreground">Tháng 3, 2026</p>
                      </div>
                      {/* Chart mockup */}
                      <div className="bg-card rounded-2xl p-4 shadow-sm border mb-4 flex-1">
                        <div className="flex items-end justify-between h-32 gap-2">
                          {[40, 65, 45, 80, 55, 70, 50].map((height, i) => (
                            <div
                              key={i}
                              className="flex-1 bg-foreground/20 rounded-t"
                              style={{ height: `${height}%` }}
                            />
                          ))}
                        </div>
                        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                          {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
                            <span key={day}>{day}</span>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        {[
                          { name: "Ăn uống", percent: 35, color: "bg-accent" },
                          { name: "Di chuyển", percent: 25, color: "bg-foreground/60" },
                          { name: "Mua sắm", percent: 20, color: "bg-foreground/40" },
                        ].map((cat) => (
                          <div key={cat.name} className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${cat.color}`} />
                            <span className="text-xs flex-1">{cat.name}</span>
                            <span className="text-xs text-muted-foreground">{cat.percent}%</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {activeScreen === "savings" && (
                    <>
                      <div className="mb-6">
                        <p className="text-lg font-semibold">Mục tiêu tiết kiệm</p>
                        <p className="text-xs text-muted-foreground">3 mục tiêu đang hoạt động</p>
                      </div>
                      <div className="space-y-3">
                        {[
                          { name: "Du lịch Đà Nẵng", current: 8, target: 15, progress: 53 },
                          { name: "iPhone mới", current: 20, target: 25, progress: 80 },
                          { name: "Quỹ khẩn cấp", current: 30, target: 50, progress: 60 },
                        ].map((goal) => (
                          <div key={goal.name} className="bg-card rounded-xl p-3 shadow-sm border">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">{goal.name}</span>
                              <span className="text-xs text-accent">{goal.progress}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                              <div
                                className="h-full bg-foreground rounded-full"
                                style={{ width: `${goal.progress}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {goal.current}tr / {goal.target}tr đồng
                            </p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current screen description */}
        <div className="text-center mt-12">
          <p className="text-lg font-medium">
            {screens.find((s) => s.id === activeScreen)?.description}
          </p>
        </div>
      </div>
    </section>
  )
}
