import type { Metadata } from "next";
import { Suspense } from "react";
import { ManageDashboard } from "@/components/manage/ManageDashboard";

export const metadata: Metadata = {
  title: "Quản lý lá thư | Phygital Letter Studio",
  // Mã bí mật nằm trong URL: không cho lập chỉ mục và không gửi URL sang trang khác.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function ManagePage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <Suspense fallback={<p className="text-muted-foreground">Đang tải...</p>}>
        <ManageDashboard />
      </Suspense>
    </main>
  );
}
