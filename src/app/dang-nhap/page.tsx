import { CuteLoader } from "@/components/cute/CuteLoader";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/account/AuthForm";
import { AuthShell } from "@/components/account/AuthShell";

export const metadata: Metadata = {
  title: "Đăng nhập | Thư Nhỏ",
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <AuthShell>
      <Suspense fallback={<CuteLoader label="Đang tải..." />}>
        <AuthForm />
      </Suspense>
    </AuthShell>
  );
}
