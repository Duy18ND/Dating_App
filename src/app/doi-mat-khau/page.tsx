import type { Metadata } from "next";
import { AuthShell } from "@/components/account/AuthShell";
import { NewPasswordForm } from "@/components/account/NewPasswordForm";

export const metadata: Metadata = {
  title: "Đặt mật khẩu mới | Phygital Letter Studio",
  robots: { index: false, follow: false },
};

// proxy.ts chặn trang này khi chưa có phiên (phiên tạm tạo từ link đặt lại mật khẩu).
export default function NewPasswordPage() {
  return (
    <AuthShell>
      <NewPasswordForm />
    </AuthShell>
  );
}
