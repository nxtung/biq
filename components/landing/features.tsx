import { Card, CardContent } from "@/components/ui/card"
import { Wallet, PieChart, Bell, Shield, Zap, TrendingUp } from "lucide-react"

const features = [
  {
    icon: Wallet,
    title: "Quản lý chi tiêu",
    description: "Theo dõi mọi khoản thu chi một cách tự động và thông minh.",
  },
  {
    icon: PieChart,
    title: "Phân tích tài chính",
    description: "Biểu đồ trực quan giúp bạn hiểu rõ thói quen chi tiêu.",
  },
  {
    icon: Bell,
    title: "Nhắc nhở thanh toán",
    description: "Không bao giờ bỏ lỡ hóa đơn với thông báo tự động.",
  },
  {
    icon: Shield,
    title: "Bảo mật tuyệt đối",
    description: "Dữ liệu được mã hóa và bảo vệ theo tiêu chuẩn ngân hàng.",
  },
  {
    icon: Zap,
    title: "Giao dịch nhanh chóng",
    description: "Chuyển tiền, thanh toán chỉ trong vài giây.",
  },
  {
    icon: TrendingUp,
    title: "Mục tiêu tiết kiệm",
    description: "Đặt mục tiêu và theo dõi tiến trình tiết kiệm của bạn.",
  },
]

export function LandingFeatures() {
  return (
    <section id="features" className="py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
            Tính năng nổi bật
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Amio cung cấp đầy đủ công cụ để bạn kiểm soát tài chính cá nhân một cách hiệu quả.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-foreground text-background rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
