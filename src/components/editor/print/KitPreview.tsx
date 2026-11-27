"use client";

import { FileText } from "lucide-react";
import { useCallback, useState, useSyncExternalStore, type ReactNode } from "react";
import { LetterView } from "@/components/letter/LetterView";
import { PrintGuide } from "@/components/share/PrintGuide";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/editor/store";
import { PRINT_CONFIG } from "@/lib/print-config";
import { draftQrUrl } from "@/lib/render/qr";
import { Toggle } from "../ui";
import { FoldedEnvelope } from "./FoldedEnvelope";
import { RenderedCanvas } from "./RenderedCanvas";

/** 6 px/mm: trang A4 xem trước 1260 x 1782 px, đủ nét mà nhẹ cho điện thoại. */
const SHEET_PX_PER_MM = 6;
const CARD_PIXEL_RATIO = 0.75;

const A4 = PRINT_CONFIG.PAPER_A4_MM;
const FACE = PRINT_CONFIG.CARD_FACE_MM;

const noSubscribe = () => () => {};

function Part({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </section>
  );
}

/**
 * FR-13: xem trước cả bộ bằng đúng các hàm xuất PDF, và tải PDF thử khi chưa xuất bản.
 */
export function KitPreview() {
  const canvas = useEditorStore((s) => s.doc.canvas_data);
  const envelopeColor = useEditorStore((s) => s.doc.web_config.envelopeColor);
  const template = useEditorStore((s) => s.doc.template_type);
  const hideBackground = useEditorStore((s) => s.printHideBackground);
  const setHideBackground = useEditorStore((s) => s.setPrintHideBackground);
  const origin = useSyncExternalStore(
    noSubscribe,
    () => window.location.origin,
    () => "",
  );
  const qrUrl = draftQrUrl(origin, template);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string>();

  const drawSheet = useCallback(async () => {
    // Konva và hàm xuất nặng, chỉ tải khi mở màn hình này.
    const { renderPrintKit, composeSheetCanvas } = await import("@/lib/client/export-pdf");
    const kit = await renderPrintKit(
      { canvas, qrUrl, envelopeColor, background: !hideBackground },
      { pxPerMm: SHEET_PX_PER_MM, cardPixelRatio: CARD_PIXEL_RATIO },
    );
    return composeSheetCanvas(kit, SHEET_PX_PER_MM);
  }, [canvas, qrUrl, envelopeColor, hideBackground]);

  async function downloadDraft() {
    setExporting(true);
    setError(undefined);
    try {
      const { exportLetterPdf } = await import("@/lib/client/export-pdf");
      await exportLetterPdf({
        canvas,
        qrUrl,
        envelopeColor,
        background: !hideBackground,
        fileName: "ban-in-thu.pdf",
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không xuất được PDF.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-canvas p-3 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-6">
      <div className="mx-auto grid max-w-5xl items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-4">
          <div className="space-y-3 rounded-lg border bg-card p-3">
            <Button type="button" disabled={exporting} onClick={downloadDraft}>
              <FileText /> {exporting ? "Đang tạo PDF..." : "Tải PDF thử"}
            </Button>
            <p className="rounded-md bg-accent p-2 text-xs">
              <strong>Bản thử để kiểm tra khổ giấy:</strong> mã QR mở trang mẫu, chưa phải thư của
              bạn. Muốn tặng thật, hãy bấm Xuất bản rồi tải PDF ở cửa sổ hiện ra.
            </p>
            <Toggle
              label="Ẩn nền phong bì và thiệp khi in (giấy Kraft hoặc giấy màu)"
              checked={hideBackground}
              onChange={setHideBackground}
            />
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <PrintGuide />
          </div>
          <Part title="Tờ A4 sẽ in (gồm phong bì trải phẳng và thiệp)">
            <RenderedCanvas
              draw={drawSheet}
              label="Xem trước trang A4 in phong bì và thiệp"
              ratio={A4.width / A4.height}
              className="border bg-white shadow-md"
            />
          </Part>
        </div>

        <div className="space-y-6">
          <Part title="Phong bì sau khi gấp">
            <FoldedEnvelope />
          </Part>
          <Part title="Thiệp: mặt in">
            <div className="overflow-hidden rounded-sm border shadow-sm">
              <LetterView
                face={canvas.faces.inside}
                qrUrl={qrUrl}
                hideBackground={hideBackground}
              />
            </div>
          </Part>
          <Part title="Thiệp: mặt sau" note="Là mặt trắng của tờ A4, dành để bạn viết tay.">
            <div
              role="img"
              aria-label="Mặt sau thiệp để trắng"
              className="w-full rounded-sm border bg-white shadow-sm"
              style={{ aspectRatio: FACE.width / FACE.height }}
            />
          </Part>
          <Part
            title="Bìa trước (chỉ trên web)"
            note="Không in ra giấy. Người nhận xem bằng nút “Xem lại tấm thiệp” trên trang web."
          >
            <div className="overflow-hidden rounded-sm border shadow-sm">
              <LetterView face={canvas.faces.front} qrUrl={qrUrl} />
            </div>
          </Part>
        </div>
      </div>
    </div>
  );
}
