import type { Metadata } from "next";
import { NewPasswordForm } from "@/components/account/NewPasswordForm";

export const metadata: Metadata = {
  title: "Đặt mật khẩu mới | Phygital Letter Studio",
  robots: { index: false, follow: false },
};

// proxy.ts chặn trang này khi chưa có phiên (phiên tạm tạo từ link đặt lại mật khẩu).
export default function NewPasswordPage() {
  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-4 py-10">
      <NewPasswordForm />
    </main>
  );
}
