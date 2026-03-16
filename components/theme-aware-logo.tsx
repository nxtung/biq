"use client";

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";

export function ThemeAwareLogo() {
  const { theme } = useTheme();
  const logoSrc = theme === 'dark' ? '/icon-dark.svg' : '/icon-light.svg';

  return (
    <Link href="/" className="flex items-center">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background font-bold">
        {/* Sử dụng key để đảm bảo Next.js Image re-render khi src thay đổi */}
        <Image key={logoSrc} src={logoSrc} alt="Amio Logo" width={32} height={32} className="h-full w-full" />
      </div>
      <span className="font-semibold text-lg">Amio</span>
    </Link>
  );
}