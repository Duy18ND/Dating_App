import type { NextConfig } from "next";

/**
 * Header bảo vệ cho mọi trang (T-41):
 * - Chống clickjacking: trang lạ không nhúng được /thiep-cua-toi hay /editor vào iframe để lừa
 *   bấm "Xóa". Khung xem trước của trình soạn là cùng site nên vẫn chạy.
 * - nosniff: trình duyệt không đoán sai loại file.
 * - Referrer: không gửi đường dẫn đầy đủ (có ?id=, ?next=) sang site khác.
 */
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
