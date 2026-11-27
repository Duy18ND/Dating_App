import { Clock, Mail, QrCode, Scissors } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const STEPS = [
  { icon: Mail, text: "Trang trí thiệp và trang web kể chuyện của riêng bạn" },
  { icon: Scissors, text: "In trên 1 tờ A4, cắt thành phong bì và thiệp mini" },
  { icon: QrCode, text: "Người nhận quét mã QR để mở thư, không cần tài khoản" },
  { icon: Clock, text: "Mỗi thiệp được giữ 60 ngày, sau đó mã QR ngừng hoạt động" },
];

/** Khung chung của trang đăng nhập và đặt mật khẩu: PC chia hai cột, điện thoại một cột. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh flex-1 lg:grid-cols-[5fr_6fr]">
      <aside className="hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <Link href="/" className="font-playfair text-xl">
          Phygital Letter Studio
        </Link>
        <div className="max-w-md space-y-10">
          {/* Phong bì và dấu sáp vẽ bằng CSS, chỉ để trang trí. */}
          <div aria-hidden className="relative aspect-[114/81] w-64 -rotate-3 rounded-md bg-secondary shadow-2xl">
            <div
              className="absolute inset-x-0 top-0 h-[58%] bg-[color-mix(in_srgb,var(--secondary),#fff_18%)] drop-shadow"
              style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
            />
            <div className="absolute top-[58%] left-1/2 size-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white/20 bg-primary shadow-lg" />
          </div>
          <p className="font-playfair text-3xl leading-snug">
            Thư giấy cầm trên tay, lời nhắn sống trên màn hình.
          </p>
          <ul className="space-y-3 text-sm">
            {STEPS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex gap-3">
                <Icon aria-hidden className="mt-0.5 size-4 shrink-0 opacity-80" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs opacity-75">Miễn phí.</p>
      </aside>

      <main className="flex flex-col items-center px-4 py-8 sm:justify-center">
        <Link href="/" className="mb-6 font-playfair text-lg text-primary lg:hidden">
          Phygital Letter Studio
        </Link>
        <div className="w-full max-w-sm sm:rounded-2xl sm:border sm:bg-card sm:p-8 sm:shadow-sm">
          {children}
        </div>
      </main>
    </div>
  );
}
