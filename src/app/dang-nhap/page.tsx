import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/account/AuthForm";
import { AuthShell } from "@/components/account/AuthShell";

export const metadata: Metadata = {
  title: "Đăng nhập | Phygital Letter Studio",
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <AuthShell>
      <Suspense fallback={<p className="py-24 text-center text-muted-foreground">Đang tải...</p>}>
        <AuthForm />
      </Suspense>
    </AuthShell>
  );
}
