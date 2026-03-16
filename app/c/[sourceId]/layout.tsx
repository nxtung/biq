import { Toaster } from "@/components/ui/sonner"

export default function TrackingLayout({ children }: { children: React.ReactNode }) {
  // Layout này tách biệt với layout của trang admin,
  // cung cấp một môi trường sạch cho landing page.
  // Nó vẫn kế thừa font và CSS toàn cục từ root layout.
  return (
    <>
      {children}
      <Toaster richColors position="top-center" />
    </>
  )
}