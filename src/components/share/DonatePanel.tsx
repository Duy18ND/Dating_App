"use client";

import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { Choice } from "@/components/editor/ui";
import { buttonVariants } from "@/components/ui/button";
import { CopyButton } from "./CopyButton";

// Ảnh QR tĩnh do chủ dự án đặt vào public/ (T-02). Không có thanh toán qua API.
const IMAGES = [
  { value: "bank", label: "Ngân hàng", src: "/donate-qr-bank.webp" },
  { value: "zalo", label: "ZaloPay", src: "/donate-qr-zalo.webp" },
] as const;

type Tab = (typeof IMAGES)[number]["value"];

const BANK = process.env.NEXT_PUBLIC_DONATE_BANK_NAME;
const ACCOUNT = process.env.NEXT_PUBLIC_DONATE_ACCOUNT_NUMBER;
const OWNER = process.env.NEXT_PUBLIC_DONATE_ACCOUNT_NAME;

/** Chỉ hiện những ảnh thật sự tồn tại. */
function useAvailableImages() {
  const [available, setAvailable] = useState<Tab[]>([]);
  useEffect(() => {
    let active = true;
    Promise.all(
      IMAGES.map(
        ({ value, src }) =>
          new Promise<Tab | null>((resolve) => {
            const image = new Image();
            image.onload = () => resolve(value);
            image.onerror = () => resolve(null);
            image.src = src;
          }),
      ),
    ).then((found) => active && setAvailable(found.filter((v) => v !== null)));
    return () => {
      active = false;
    };
  }, []);
  return IMAGES.filter(({ value }) => available.includes(value));
}

export function DonatePanel() {
  const images = useAvailableImages();
  const [tab, setTab] = useState<Tab>("bank");
  const current = images.find((image) => image.value === tab) ?? images[0];
  if (!current && !ACCOUNT) return null;

  return (
    <aside className="space-y-3 rounded-xl border bg-card p-4 text-center">
      <h3 className="font-semibold">Ủng hộ dự án</h3>
      <p className="text-sm text-muted-foreground">
        Công cụ hoàn toàn miễn phí. Nếu bạn thích, hãy mời tụi mình một ly trà sữa.
      </p>
      {images.length > 1 && (
        <div className="flex justify-center">
          <Choice options={[...images]} value={current.value} onChange={setTab} />
        </div>
      )}
      {current && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- giữ nguyên ảnh QR để quét chuẩn */}
          <img src={current.src} alt={`Mã QR ${current.label}`} className="mx-auto w-48 rounded-md" />
          <a
            href={current.src}
            download={`ung-ho-${current.value}.webp`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Download /> Lưu ảnh QR
          </a>
        </>
      )}
      {ACCOUNT && (
        <div className="space-y-1 text-sm">
          <p>
            {[BANK, OWNER].filter(Boolean).join(" · ")}
            <br />
            <span className="font-mono font-medium">{ACCOUNT}</span>
          </p>
          <CopyButton value={ACCOUNT} label="Copy số tài khoản" />
        </div>
      )}
    </aside>
  );
}
