import type { Metadata } from "next";
import { DraftPreview } from "@/components/viewer/DraftPreview";

// Khung xem trước nhúng trong trình soạn; nhận nội dung nháp qua postMessage, không đọc database.
export const metadata: Metadata = {
  title: "Xem trước trang web | Thư Nhỏ",
  robots: { index: false, follow: false },
};

export default function DraftPreviewPage() {
  return <DraftPreview />;
}
