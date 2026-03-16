"use client";

import Image from "next/image";
import { useTheme } from "next-themes";

export function ThemeAwareCampaignLogo() {
  const { theme } = useTheme();
  const logoSrc = theme === 'dark' ? '/icon-dark.svg' : '/icon-light.svg';

  return (
    <div className="w-20 h-20 mx-auto bg-foreground text-background rounded-2xl flex items-center justify-center">
      {/* Sử dụng key để đảm bảo Next.js Image re-render khi src thay đổi */}
      <Image key={logoSrc} src={logoSrc} alt="Amio Logo" width={80} height={80} className="h-full w-full" />
    </div>
  );
}