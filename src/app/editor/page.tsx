import type { Metadata } from "next";
import { Suspense } from "react";
import { EditorLoader } from "@/components/editor/EditorLoader";

export const metadata: Metadata = {
  title: "Trình thiết kế | Phygital Letter Studio",
  robots: { index: false, follow: false },
};

export default function EditorPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-muted-foreground">Đang tải...</p>}>
      <EditorLoader />
    </Suspense>
  );
}
