"use client";

import { Coffee, Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const DONATE_QR_SRC = "/donate-qr.jpg";

/** Khung QR ủng hộ ngắn gọn, dễ thương (dùng chung cho trang chia sẻ và sau khi in thiệp). */
export function DonatePanel({ compact = false }: { compact?: boolean }) {
  return (
    <aside
      className={
        compact
          ? "space-y-2.5 rounded-xl border border-primary/20 bg-accent/40 p-3.5 text-center"
          : "space-y-3 rounded-2xl border bg-card p-5 text-center shadow-xs"
      }
    >
      <p className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-primary">
        <Coffee className="size-4" />
        {compact ? "Mời tụi mình 1 ly cà phê nhé ☕" : "Ủng hộ Thư Nhỏ ☕"}
      </p>
      <p className="mx-auto max-w-sm text-xs leading-relaxed text-muted-foreground">
        {compact
          ? "Web miễn phí 100%. Nếu tấm thiệp làm người ấy mỉm cười, gửi chút yêu thương nuôi server chạy mượt nhé — hoàn toàn tùy tâm ạ 💌"
          : "Thư Nhỏ hoàn toàn miễn phí. Nếu bạn thấy hữu ích, mời tụi mình 1 ly cà phê nuôi server chạy mượt nhé — hoàn toàn tùy tâm ạ 💌"}
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element -- giữ nguyên ảnh QR để quét chuẩn */}
      <img
        src={DONATE_QR_SRC}
        alt="Mã QR ủng hộ DOAN MANH DUY"
        className={
          compact
            ? "mx-auto w-44 rounded-xl border bg-white p-1 shadow-xs"
            : "mx-auto w-52 rounded-xl border bg-white p-1.5 shadow-xs"
        }
      />
      <p className="text-xs font-semibold tracking-wide text-foreground">DOAN MANH DUY</p>
      <p className="text-[11px] text-muted-foreground">
        Quét được từ mọi ứng dụng ngân hàng, ZaloPay & MoMo
      </p>
      <a
        href={DONATE_QR_SRC}
        download="ung-ho-thu-nho-qr.jpg"
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        <Download className="size-3.5" /> Lưu ảnh QR
      </a>
    </aside>
  );
}
