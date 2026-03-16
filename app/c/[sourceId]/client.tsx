"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Apple, Play, Loader2 } from "lucide-react"
import { Campaign, CampaignSource } from "@/lib/db/schema"
import { toast } from "sonner"
import { UAParser } from "ua-parser-js"

interface AppDownloadClientProps {
  campaign: Campaign
  source: CampaignSource
  ipAddress: string | null // Passed from Server Component
  userAgent: string | null  // Passed from Server Component
}

export function AppDownloadClient({ campaign, source, ipAddress, userAgent }: AppDownloadClientProps) {
  const [isRedirecting, setIsRedirecting] = useState<"ios" | "android" | null>(null)
  const [clickId, setClickId] = useState<string | null>(null); // State to store the recorded clickId
  const [visitorFingerprint, setVisitorFingerprint] = useState<string | null>(null); // State to store visitor fingerprint
  const [deviceType, setDeviceType] = useState<"ios" | "android" | "desktop" | "other">("other"); // State for client-side device detection

  // Effect to detect device type
  useEffect(() => {
    const parser = new UAParser(userAgent || undefined);
    const os = parser.getOS().name?.toLowerCase();
    if (os?.includes("ios") || os?.includes("mac")) {
      setDeviceType("ios");
    } else if (os?.includes("android")) {
      setDeviceType("android");
    } else {
      setDeviceType("desktop");
    }
  }, [userAgent]);

  // Effect to record the initial click when the component mounts
  useEffect(() => {
    // Sử dụng các key rõ ràng hơn cho sessionStorage
    const clickIdKey = `click_id_${source.id}`;
    const fingerprintKey = `fingerprint_${source.id}`;
    
    const storedClickId = sessionStorage.getItem(clickIdKey);
    const storedFingerprint = sessionStorage.getItem(fingerprintKey);

    if (storedClickId && storedFingerprint) {
      setClickId(storedClickId);
      setVisitorFingerprint(storedFingerprint);
      return;
    }

    const recordInitialClick = async () => {
      try {
        const { default: FingerprintJS } = await import("@fingerprintjs/fingerprintjs");
        const fp = await FingerprintJS.load();
        const result = await fp.get();

        const clickResponse = await fetch("/api/clicks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaignId: campaign.id,
            sourceId: source.id,
            fingerprint: result.visitorId, // visitorId
            fingerprintData: result.components, // Toàn bộ dữ liệu thô
            // IP and UserAgent are captured by the API route from request headers
          }),
        });

        if (!clickResponse.ok) {
          throw new Error("Failed to record initial click.");
        }
        const { clickId: newClickId } = await clickResponse.json();
        setClickId(newClickId);
        setVisitorFingerprint(result.visitorId); // Store fingerprint
        // Lưu cả clickId và fingerprint vào sessionStorage để chống trùng lặp khi refresh
        sessionStorage.setItem(clickIdKey, newClickId);
        sessionStorage.setItem(fingerprintKey, result.visitorId);
      } catch (error) {
        console.error("Failed to record initial click:", error);
        toast.error("Không thể ghi nhận lượt click.");
      }
    };

    recordInitialClick();
  }, [campaign.id, source.id]); // Dependencies: campaign.id and source.id


  const handleRedirectToStore = async (platform: "ios" | "android") => {
    setIsRedirecting(platform)
    try {
      if (!clickId) {
        toast.error("Click ID chưa sẵn sàng. Vui lòng thử lại.");
        setIsRedirecting(null);
        return;
      }

      const getDetailedDeviceInfo = async () => {
        try {
          const deviceInfo: any = {
            screen: {
              width: window.screen.width,
              height: window.screen.height,
              colorDepth: window.screen.colorDepth,
              pixelRatio: window.devicePixelRatio,
            },
            navigator: {
              language: navigator.language,
              platform: navigator.platform,
              vendor: navigator.vendor,
              hardwareConcurrency: navigator.hardwareConcurrency,
              deviceMemory: (navigator as any).deviceMemory,
              // Lấy thông tin hỗ trợ cảm ứng
              touchSupport: {
                maxTouchPoints: navigator.maxTouchPoints,
                touchEvent: 'ontouchstart' in window,
              },
              // Lấy thông tin kết nối mạng
              connection: (navigator as any).connection ? {
                effectiveType: (navigator as any).connection.effectiveType,
                type: (navigator as any).connection.type,
              } : null,
            },
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            battery: null,
          };

          // Lấy thông tin pin (bất đồng bộ)
          if ((navigator as any).getBattery) {
            const battery = await (navigator as any).getBattery();
            deviceInfo.battery = {
              level: battery.level,
              charging: battery.charging,
            };
          }

          return deviceInfo;
        } catch (e) {
          console.warn("Không thể thu thập thông tin chi tiết thiết bị:", e);
          return null;
        }
      };

      // Thu thập thông tin thiết bị chi tiết
      const detailedInfo = await getDetailedDeviceInfo();

      // 1. Lấy token định danh từ server
      const tokenRes = await fetch("/api/install-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clickId: clickId, // Use the clickId obtained from initial recording
          campaignId: campaign.id,
          sourceId: source.id,
          fingerprint: visitorFingerprint, // Pass fingerprint to install token
          deviceInfo: detailedInfo,
        }),
      })

      if (!tokenRes.ok) {
        throw new Error("Không thể tạo token định danh.")
      }
      const { token } = await tokenRes.json()

      // 2. Xác định link cửa hàng ứng dụng
      const storeUrl = platform === "ios" ? campaign.iosLink : campaign.androidLink
      if (!storeUrl) {
        throw new Error("Link cửa hàng ứng dụng chưa được cấu hình.")
      }

      // 3. Xây dựng link cuối cùng với token
      let finalUrlString: string;
      const tokenParamName = process.env.NEXT_PUBLIC_DEEPLINK_TOKEN_PARAM || "amio_token";

      if (platform === 'android') {
        // Đối với Android, sử dụng định dạng Play Install Referrer
        const referrer = new URLSearchParams({ [tokenParamName]: token }).toString();
        finalUrlString = `${storeUrl}&referrer=${encodeURIComponent(referrer)}`;
      } else {
        // Đối với iOS, sử dụng tham số truy vấn chuẩn cho Universal Links
        const finalUrl = new URL(storeUrl);
        finalUrl.searchParams.set(tokenParamName, token);
        finalUrlString = finalUrl.toString();
      }

      // 4. Chuyển hướng người dùng
      window.location.href = finalUrlString;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể chuyển đến cửa hàng ứng dụng."
      toast.error(message)
      console.error(error)
      setIsRedirecting(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background flex flex-col items-center justify-center p-4 font-sans">
      <main className="w-full max-w-md">
        <Card className="border-0 shadow-lg animate-in fade-in-50 slide-in-from-bottom-10 duration-500">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-foreground text-background rounded-2xl flex items-center justify-center">
              <span className="text-4xl font-bold">A</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">{campaign.name}</h1>
            {campaign.promotion && (
              <div className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                {campaign.promotion}
              </div>
            )}
            <p className="text-muted-foreground mb-8">
              {campaign.description || "Tải ứng dụng ngay để nhận ưu đãi."}
            </p>
            <div className="space-y-4">
              {/* Hiển thị nút iOS nếu là iOS hoặc không phải mobile (desktop/other) */}
              {campaign.iosLink && (deviceType === "ios" || deviceType === "desktop" || deviceType === "other") && (
                <Button size="lg" className="w-full gap-2 h-14 text-base" onClick={() => handleRedirectToStore("ios")} disabled={!!isRedirecting || !clickId}>
                  {isRedirecting === "ios" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Apple className="h-6 w-6" />} Tải trên App Store
                </Button>
              )}
              {/* Hiển thị nút Android nếu là Android hoặc không phải mobile (desktop/other) */}
              {campaign.androidLink && (deviceType === "android" || deviceType === "desktop" || deviceType === "other") && (
                <Button
                  size="lg"
                  variant={deviceType === "android" ? "default" : "outline"}
                  className="w-full gap-2 h-14 text-base"
                  onClick={() => handleRedirectToStore("android")}
                  disabled={!!isRedirecting || !clickId}
                >
                  {isRedirecting === "android" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-6 w-6" />} Tải trên Google Play
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground mt-8">Được cung cấp bởi AmioTrack</p>
      </main>
    </div>
  )
}
