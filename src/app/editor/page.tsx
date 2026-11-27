import type { Metadata } from "next";
import { Suspense } from "react";
import { EditorLoader } from "@/components/editor/EditorLoader";

export const metadata: Metadata = {
  title: "Trình thiết kế | Phygital Letter Studio",
  // ?edit= chứa mã bí mật: không lập chỉ mục, không gửi URL sang trang khác.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function EditorPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-muted-foreground">Đang tải...</p>}>
      <EditorLoader />
    </Suspense>
  );
}
