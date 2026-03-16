"use client";

import Image from "next/image";
import { useTheme } from "next-themes";

export function ThemeAwareSidebarLogo() {
  const { theme } = useTheme();
  const logoSrc = theme === 'dark' ? '/icon-dark.svg' : '/icon-light.svg';

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
      {/* Sử dụng key để đảm bảo Next.js Image re-render khi src thay đổi */}
      <Image key={logoSrc} src={logoSrc} alt="AmioTrack Logo" width={32} height={32} className="h-full w-full" />
    </div>
  );
}