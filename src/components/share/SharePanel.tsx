"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { inputClass, Toggle } from "@/components/editor/ui";
import { Button } from "@/components/ui/button";
import { recipientLink, sanitizeRecipient } from "@/lib/recipient";
import { createQrBlob, letterUrl, quietZone } from "@/lib/render/qr";
import { LIMITS } from "@/lib/validation";
import type { CanvasData } from "@/types/letter";
import { CopyButton } from "./CopyButton";
import { PrintDialog } from "./PrintDialog";
import { PrintGuide } from "./PrintGuide";

const QR_PNG_PX = 1024;

async function downloadQr(url: string, slug: string, canvas: CanvasData) {
  const design = canvas.faces.inside.elements.find((el) => el.type === "qr_code");
  const blob = await createQrBlob({
    url,
    size: QR_PNG_PX,
    color: design?.fill ?? "#2B2623",
    iconId: design?.iconId,
    margin: quietZone(QR_PNG_PX),
  });
  const objectUrl = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement("a"), {
    href: objectUrl,
    download: `qr-${slug}.png`,
  });
  link.click();
  // Đợi trình duyệt bắt đầu tải rồi mới thu hồi.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export function LinkRow({ label, url }: { label: string; url: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <input
          className={inputClass}
          aria-label={label}
          readOnly
          value={url}
          onFocus={(event) => event.target.select()}
        />
        <CopyButton value={url} />
      </div>
    </div>
  );
}

/** Link ngắn, QR tải PNG, link riêng theo khách và nút PDF. Dùng ở modal xuất bản và trang quản lý. */
export function SharePanel({
  slug,
  canvas,
  envelopeColor,
  recipientName,
  defaultHideBackground = false,
}: {
  slug: string;
  canvas: CanvasData;
  envelopeColor: string;
  recipientName: string;
  defaultHideBackground?: boolean;
}) {
  const [guest, setGuest] = useState("");
  const [error, setError] = useState<string>();
  const [hideBackground, setHideBackground] = useState(defaultHideBackground);
  // Thành phần này chỉ dựng sau thao tác trên trình duyệt nên luôn có window.
  const url = letterUrl(window.location.origin, slug);

  return (
    <div className="space-y-4">
      <LinkRow label="Link lá thư" url={url} />

      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setError(undefined);
          downloadQr(url, slug, canvas).catch(() => setError("Không tạo được mã QR, hãy thử lại."));
        }}
      >
        <Download /> Tải mã QR (PNG)
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="space-y-2 rounded-lg border p-3">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Tạo link riêng cho từng người</span>
          <input
            className={inputClass}
            placeholder="Tên người nhận riêng, ví dụ Minh Anh"
            maxLength={LIMITS.maxNameLength}
            value={guest}
            onChange={(event) => setGuest(event.target.value)}
          />
        </label>
        {sanitizeRecipient(guest) && <LinkRow label="Link riêng" url={recipientLink(url, guest)} />}
      </div>

      <div className="space-y-2">
        <PrintDialog
          label="Tải PDF bộ in"
          fileName={`bo-thiep-${slug}.pdf`}
          input={{
            canvas,
            qrUrl: url,
            envelopeColor,
            recipientName,
            background: !hideBackground,
          }}
        />
        <Toggle
          label="Ẩn nền phong bì và thiệp khi in (giấy Kraft hoặc giấy màu)"
          checked={hideBackground}
          onChange={setHideBackground}
        />
        <PrintGuide />
      </div>
    </div>
  );
}
