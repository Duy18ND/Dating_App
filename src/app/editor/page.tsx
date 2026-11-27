import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EditorPlaceholder } from "./EditorPlaceholder";

export const metadata: Metadata = { title: "Trình thiết kế | Phygital Letter Studio" };

// TRANG TẠM. T-09 thay bằng trình thiết kế thật (Konva Stage + Transformer + các panel
// trong src/components/editor).
export default function EditorPage() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-8">
      <Link href="/" className="text-sm text-primary underline">
        Về trang chủ
      </Link>
      <Suspense fallback={<p className="mt-4">Đang tải...</p>}>
        <EditorPlaceholder />
      </Suspense>
    </main>
  );
}
