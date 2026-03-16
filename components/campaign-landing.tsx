"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Apple, Play, Smartphone } from "lucide-react"

function ThemeAwareCampaignLogo() {
  const { theme } = useTheme()
  const logoSrc = theme === "dark" ? "/icon.svg" : "/icon.svg"

  return (
    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-primary p-3">
      <Image key={logoSrc} src={logoSrc} alt="Amio Logo" width={80} height={80} className="h-full w-full" />
    </div>
  )
}

interface CampaignLandingProps {
  campaignId: string
  sourceId: string
  campaignName: string
  promotion?: string | null
  iosLink?: string | null
  androidLink?: string | null
}

export function CampaignLanding({
  campaignId,
  sourceId,
  campaignName,
  promotion,
  iosLink,
  androidLink,
}: CampaignLandingProps) {
  const [deviceType, setDeviceType] = useState<"ios" | "android" | "desktop">("desktop")
  const [isRecorded, setIsRecorded] = useState(false)

  useEffect(() => {
    // Detect device type
    const userAgent = navigator.userAgent.toLowerCase()
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setDeviceType("ios")
    } else if (/android/.test(userAgent)) {
      setDeviceType("android")
    } else {
      setDeviceType("desktop")
    }

    // Record click
    const recordClick = async () => {
      if (isRecorded) return

      try {
        // Get fingerprint
        const { default: FingerprintJS } = await import("@fingerprintjs/fingerprintjs")
        const fp = await FingerprintJS.load()
        const result = await fp.get()

        await fetch("/api/clicks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaignId,
            sourceId,
            fingerprint: result.visitorId,
            components: result.components,
          }),
        })

        setIsRecorded(true)
      } catch (error) {
        console.error("Failed to record click:", error)
      }
    }

    recordClick()
  }, [campaignId, sourceId, isRecorded])

  const handleInstall = async (platform: "ios" | "android") => {
    try {
      // Create install token
      const response = await fetch("/api/install-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          sourceId,
          platform,
        }),
      })

      const data = await response.json()

      // Redirect to store
      const storeUrl = platform === "ios" 
        ? (iosLink || "https://apps.apple.com/app/amio")
        : (androidLink || "https://play.google.com/store/apps/details?id=com.dgx.amio")

      // Append token to URL for deep linking
      const url = new URL(storeUrl)
      if (data.token) {
        url.searchParams.set("ref", data.token)
      }

      window.location.href = url.toString()
    } catch (error) {
      console.error("Failed to create install token:", error)
      // Still redirect even if token creation fails
      const storeUrl = platform === "ios" 
        ? (iosLink || "https://apps.apple.com/app/amio")
        : (androidLink || "https://play.google.com/store/apps/details?id=com.dgx.amio")
      window.location.href = storeUrl
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background font-bold text-lg">
            A
          </div>
          <span className="font-semibold text-xl">Amio</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              {/* App icon */}
              <div className="w-20 h-20 mx-auto mb-6">
                <ThemeAwareCampaignLogo />
              </div>

              <h1 className="text-2xl font-bold mb-2">{campaignName}</h1>
              
              {promotion && (
                <div className="inline-block bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium mb-4">
                  {promotion}
                </div>
              )}

              <p className="text-muted-foreground mb-8">
                Tải ứng dụng Amio ngay để quản lý tài chính thông minh hơn.
              </p>

              {/* Install buttons */}
              <div className="space-y-3">
                {deviceType === "ios" || deviceType === "desktop" ? (
                  <Button
                    size="lg"
                    className="w-full gap-2"
                    onClick={() => handleInstall("ios")}
                  >
                    <Apple className="h-5 w-5" />
                    Tải trên App Store
                  </Button>
                ) : null}

                {deviceType === "android" || deviceType === "desktop" ? (
                  <Button
                    size="lg"
                    variant={deviceType === "android" ? "default" : "outline"}
                    className="w-full gap-2"
                    onClick={() => handleInstall("android")}
                  >
                    <Play className="h-5 w-5" />
                    Tải trên Google Play
                  </Button>
                ) : null}
              </div>

              {/* Device indicator */}
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Smartphone className="h-4 w-4" />
                <span>
                  {deviceType === "ios" ? "iPhone / iPad" : 
                   deviceType === "android" ? "Android" : 
                   "Quét mã QR trên điện thoại"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Công ty Cổ phần Công nghệ DGX
          </p>
        </div>
      </main>
    </div>
  )
}
