import type { Metadata } from "next";
import Link from "next/link";
import { AccountPanel } from "@/components/account/AccountPanel";
import { MyLetters } from "@/components/account/MyLetters";

export const metadata: Metadata = {
  title: "Thiệp của tôi | Thư Nhỏ",
  robots: { index: false, follow: false },
};

// proxy.ts chặn trang này khi chưa đăng nhập; dữ liệu lấy từ /api/me/* (lọc theo chủ).
export default function MyLettersPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-8">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-playfair text-3xl text-primary">Thiệp của tôi</h1>
        <Link href="/" className="text-sm text-muted-foreground underline">
          Trang chủ
        </Link>
      </header>
      <MyLetters />
      <AccountPanel />
    </main>
  );
}
