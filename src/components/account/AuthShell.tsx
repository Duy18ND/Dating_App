import { Clock, Mail, QrCode, Scissors } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark, BRAND_NAME } from "@/components/BrandMark";
import { CuteEnvelope } from "@/components/cute/CuteEnvelope";
import { FloatingHearts } from "@/components/cute/FloatingHearts";

const STEPS = [
  { icon: Mail, text: "Trang trí thiệp và trang web kể chuyện của riêng bạn" },
  { icon: Scissors, text: "In 2 mặt trên 1 tờ A4, cắt thành phong bì và thiệp mini" },
  { icon: QrCode, text: "Người nhận quét mã QR để mở thư, không cần tài khoản" },
  { icon: Clock, text: "Mỗi thiệp được giữ 60 ngày, sau đó mã QR ngừng hoạt động" },
];

/** Khung chung của trang đăng nhập và đặt mật khẩu: PC chia hai cột, điện thoại một cột. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh flex-1 lg:grid-cols-[5fr_6fr]">
      <aside className="relative hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <FloatingHearts className="text-[#FFD6DE]" />
        <Link href="/" className="relative inline-flex items-center gap-2 font-playfair text-xl font-semibold">
          <BrandMark className="size-7 shrink-0" />
          <span>{BRAND_NAME}</span>
        </Link>
        <div className="relative max-w-md space-y-8">
          <CuteEnvelope className="anim-float w-60 drop-shadow-2xl" />
          <p className="font-playfair text-3xl leading-snug">
            Thư giấy cầm trên tay, lời nhắn sống trên màn hình.
          </p>
          <ul className="space-y-3 text-sm">
            {STEPS.map(({ icon: Icon, text }, index) => (
              <li
                key={text}
                className="anim-rise flex gap-3"
                style={{ animationDelay: `${150 + index * 90}ms` }}
              >
                <Icon aria-hidden className="mt-0.5 size-4 shrink-0 opacity-80" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs opacity-75">Miễn phí.</p>
      </aside>

      <main className="relative flex flex-col items-center px-4 py-6 sm:justify-center">
        <FloatingHearts className="lg:opacity-60" />
        <Link href="/" className="relative mb-2 inline-flex items-center gap-1.5 font-playfair text-lg font-semibold text-primary lg:hidden">
          <BrandMark className="size-6 shrink-0" />
          <span>{BRAND_NAME}</span>
        </Link>
        <CuteEnvelope className="anim-float relative mb-2 w-24 lg:hidden" />
        <div className="anim-rise relative w-full max-w-sm sm:rounded-2xl sm:border sm:bg-card sm:p-8 sm:shadow-sm">
          {children}
        </div>
      </main>
    </div>
  );
}
