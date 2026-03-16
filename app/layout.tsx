import type { Metadata, Viewport } from 'next'
import { Be_Vietnam_Pro } from 'next/font/google' // 1. Thay thế Inter bằng font bạn muốn
import { Analytics } from '@vercel/analytics/next'
import { cn } from "@/lib/utils"
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/components/auth-provider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const fontSans = Be_Vietnam_Pro({ // 2. Gọi hàm khởi tạo font mới
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"], // 3. (Tùy chọn) Chọn các độ đậm bạn cần
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: {
    default: 'AmioTrack - Marketing Campaign Tracking',
    template: '%s | AmioTrack',
  },
  description: 'Track app installations from marketing campaigns - Công ty Cổ phần Công nghệ DGX',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      {/* Sử dụng cn() để nối class một cách an toàn */}
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable // 4. Sử dụng biến từ font mới
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
