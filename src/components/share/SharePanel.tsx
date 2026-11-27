"use client";

import { Download, FileText } from "lucide-react";
import { useState } from "react";
import { inputClass, Toggle } from "@/components/editor/ui";
import { Button } from "@/components/ui/button";
import type { PrintSize } from "@/lib/print-config";
import { recipientLink, sanitizeRecipient } from "@/lib/recipient";
import { createQrBlob, letterUrl, quietZone } from "@/lib/render/qr";
import { LIMITS } from "@/lib/validation";
import type { CanvasData } from "@/types/letter";
import { CopyButton } from "./CopyButton";

const QR_PNG_PX = 1024;

async function downloadQr(url: string, slug: string, canvas: CanvasData) {
  const design = canvas.elements.find((el) => el.type === "qr_code");
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
  defaultHideBackground = false,
}: {
  slug: string;
  canvas: CanvasData;
  defaultHideBackground?: boolean;
}) {
  const [guest, setGuest] = useState("");
  const [error, setError] = useState<string>();
  const [hideBackground, setHideBackground] = useState(defaultHideBackground);
  const [exporting, setExporting] = useState<PrintSize | null>(null);
  const [pdfError, setPdfError] = useState<string>();
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
        {sanitizeRecipient(guest) && (
          <LinkRow label="Link riêng" url={recipientLink(url, guest)} />
        )}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {(["A6", "A5"] as const).map((size) => (
            <Button
              key={size}
              type="button"
              variant={size === canvas.defaultPrintSize ? "default" : "outline"}
              disabled={exporting !== null}
              onClick={async () => {
                setExporting(size);
                setPdfError(undefined);
                try {
                  // Konva và jsPDF nặng, chỉ tải khi bấm nút.
                  const { exportLetterPdf } = await import("@/lib/client/export-pdf");
                  await exportLetterPdf({
                    canvas,
                    qrUrl: url,
                    size,
                    hideBackground,
                    fileName: `thiep-${slug}-${size}.pdf`,
                  });
                } catch (cause) {
                  setPdfError(cause instanceof Error ? cause.message : "Không xuất được PDF.");
                } finally {
                  setExporting(null);
                }
              }}
            >
              <FileText /> {exporting === size ? "Đang tạo PDF..." : `Tải PDF ${size}`}
            </Button>
          ))}
        </div>
        <Toggle
          label="Ẩn nền khi in (giấy Kraft hoặc giấy màu)"
          checked={hideBackground}
          onChange={setHideBackground}
        />
        <p className="text-xs text-muted-foreground">
          PDF gồm 2 trang A4: phôi phong bì C6 (nét liền cắt, nét đứt gấp) và thiệp kèm dấu cắt
          góc. In đúng 100%, không chọn &quot;Vừa trang&quot;.
        </p>
        {pdfError && (
          <p role="alert" className="text-sm text-destructive">
            {pdfError}
          </p>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Mẹo in: thiệp dùng giấy 250–300 gsm, phong bì Kraft dùng giấy 120–180 gsm.
      </p>
    </div>
  );
}
