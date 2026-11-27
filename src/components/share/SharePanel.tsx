"use client";

import { Download, FileText } from "lucide-react";
import { useState } from "react";
import { inputClass, Toggle } from "@/components/editor/ui";
import { Button } from "@/components/ui/button";
import { recipientLink, sanitizeRecipient } from "@/lib/recipient";
import { createQrBlob, letterUrl, quietZone } from "@/lib/render/qr";
import { LIMITS } from "@/lib/validation";
import type { CanvasData } from "@/types/letter";
import { CopyButton } from "./CopyButton";

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
  defaultHideBackground = false,
}: {
  slug: string;
  canvas: CanvasData;
  envelopeColor: string;
  defaultHideBackground?: boolean;
}) {
  const [guest, setGuest] = useState("");
  const [error, setError] = useState<string>();
  const [hideBackground, setHideBackground] = useState(defaultHideBackground);
  const [exporting, setExporting] = useState(false);
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
        {sanitizeRecipient(guest) && <LinkRow label="Link riêng" url={recipientLink(url, guest)} />}
      </div>

      <div className="space-y-2">
        <Button
          type="button"
          disabled={exporting}
          onClick={async () => {
            setExporting(true);
            setPdfError(undefined);
            try {
              // Konva và jsPDF nặng, chỉ tải khi bấm nút.
              const { exportLetterPdf } = await import("@/lib/client/export-pdf");
              await exportLetterPdf({
                canvas,
                qrUrl: url,
                envelopeColor,
                background: !hideBackground,
                fileName: `bo-thiep-${slug}.pdf`,
              });
            } catch (cause) {
              setPdfError(cause instanceof Error ? cause.message : "Không xuất được PDF.");
            } finally {
              setExporting(false);
            }
          }}
        >
          <FileText /> {exporting ? "Đang tạo PDF..." : "Tải PDF bộ in"}
        </Button>
        <Toggle
          label="Ẩn nền phong bì và thiệp khi in (giấy Kraft hoặc giấy màu)"
          checked={hideBackground}
          onChange={setHideBackground}
        />
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <p>
            PDF chỉ 1 trang A4, in 1 mặt (giấy 180–220gsm), đúng 100%, không chọn &quot;Vừa
            trang&quot;. Bản in không có chữ hướng dẫn, các bước ở đây:
          </p>
          {/* Hướng dẫn lắp ráp chỉ nằm trên web, không in lên giấy (v1.7). */}
          <ol className="list-decimal space-y-0.5 pl-5">
            <li>Cắt theo nét liền (chỗ có hình cây kéo), kể cả khe cong nhỏ trên nắp dưới.</li>
            <li>Thiệp: cắt theo 4 dấu góc. Mặt sau để trắng, bạn viết tay lời nhắn ở đó.</li>
            <li>Gấp theo nét đứt: hai tai bên vào trước, rồi nắp dưới lên.</li>
            <li>Bôi keo vào ô gạch chéo trên hai tai bên rồi ép nắp dưới lên.</li>
            <li>Bỏ thiệp vào, gấp nắp trên xuống và cài tai vào khe.</li>
          </ol>
        </div>
        {pdfError && (
          <p role="alert" className="text-sm text-destructive">
            {pdfError}
          </p>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Mẹo in: thiệp 150–180 gsm (dán 2 lớp), thư 80–100 gsm, phong bì 120–150 gsm.
      </p>
    </div>
  );
}
