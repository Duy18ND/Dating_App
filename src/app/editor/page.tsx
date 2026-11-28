import { CuteLoader } from "@/components/cute/CuteLoader";
import type { Metadata } from "next";
import { Suspense } from "react";
import { EditorLoader } from "@/components/editor/EditorLoader";

export const metadata: Metadata = {
  title: "Trình thiết kế | Thư Nhỏ",
  robots: { index: false, follow: false },
};

export default function EditorPage() {
  return (
    <Suspense fallback={<CuteLoader label="Đang tải..." />}>
      <EditorLoader />
    </Suspense>
  );
}
