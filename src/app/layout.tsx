import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import "./globals.css";

const title = "Phygital Letter Studio";
const description = "Thiết kế thiệp, in trên giấy và gửi kèm mã QR mở thư có nhạc.";

export const metadata: Metadata = {
  // Ảnh OpenGraph cần URL tuyệt đối thì Messenger và Zalo mới tải được.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title,
  description,
  openGraph: { title, description, siteName: title, locale: "vi_VN", type: "website" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
