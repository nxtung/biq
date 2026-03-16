import { Button } from "@/components/ui/button"
import { Apple, Play } from "lucide-react"

export function LandingHero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-background" />
      
      <div className="container mx-auto px-4 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance mb-6">
              {"Quản lý tài chính"}
              <span className="block">{"thông minh hơn."}</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8 text-pretty">
              {"Amio giúp bạn theo dõi chi tiêu, tiết kiệm hiệu quả và đạt được mục tiêu tài chính một cách dễ dàng."}
            </p>
            
            <div id="download" className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" className="gap-2">
                <Apple className="h-5 w-5" />
                App Store
              </Button>
              <Button size="lg" variant="outline" className="gap-2">
                <Play className="h-5 w-5" />
                Google Play
              </Button>
            </div>
            
            <p className="mt-6 text-sm text-muted-foreground">
              {"Miễn phí tải xuống. Không cần thẻ tín dụng."}
            </p>
          </div>
          
          {/* Phone mockup */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-64 md:w-72 lg:w-80">
              {/* Phone frame */}
              <div className="relative bg-foreground rounded-[3rem] p-2 shadow-2xl">
                <div className="bg-background rounded-[2.5rem] overflow-hidden aspect-[9/19]">
                  {/* Screen content */}
                  <div className="h-full w-full bg-gradient-to-br from-muted to-background p-6 flex flex-col">
                    {/* Status bar */}
                    <div className="flex justify-between items-center text-xs text-muted-foreground mb-8">
                      <span>9:41</span>
                      <div className="flex gap-1">
                        <div className="w-4 h-2 bg-foreground rounded-sm" />
                      </div>
                    </div>
                    
                    {/* Balance card */}
                    <div className="bg-card rounded-2xl p-4 shadow-sm border mb-4">
                      <p className="text-xs text-muted-foreground mb-1">{"Tổng số dư"}</p>
                      <p className="text-2xl font-bold">{"12.450.000 đ"}</p>
                      <p className="text-xs text-accent mt-1">{"+2.3% so với tháng trước"}</p>
                    </div>
                    
                    {/* Quick actions */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {["Chuyển", "Nạp", "Rút", "Quét"].map((action, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-1">
                          <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                            <div className="w-4 h-4 bg-foreground/20 rounded" />
                          </div>
                          <span className="text-[10px] text-muted-foreground">{action}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Recent transactions */}
                    <div className="flex-1">
                      <p className="text-xs font-medium mb-2">{"Giao dịch gần đây"}</p>
                      <div className="space-y-2">
                        {[
                          { name: "Grab", amount: "-45.000 đ" },
                          { name: "Shopee", amount: "-320.000 đ" },
                          { name: "Lương", amount: "+8.500.000 đ" },
                        ].map((tx, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-muted/50 rounded-lg p-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-muted rounded-full" />
                              <span className="text-xs">{tx.name}</span>
                            </div>
                            <span className={`text-xs font-medium ${tx.amount.startsWith("+") ? "text-accent" : ""}`}>
                              {tx.amount}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-muted rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
