import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LandingHero } from "@/components/landing/hero"
import { LandingFeatures } from "@/components/landing/features"
import { LandingScreenshots } from "@/components/landing/screenshots"
import { LandingFooter } from "@/components/landing/footer"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background font-bold">
              A
            </div>
            <span className="font-semibold text-lg">Amio</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Tính năng
            </Link>
            <Link href="#screenshots" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Ứng dụng
            </Link>
            <Link href="#download" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Tải xuống
            </Link>
          </nav>
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Đăng nhập</Link>
          </Button>
        </div>
      </header>

      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingScreenshots />
      </main>

      <LandingFooter />
    </div>
  )
}
