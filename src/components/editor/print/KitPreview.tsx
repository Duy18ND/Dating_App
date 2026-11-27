"use client";

import { FileText } from "lucide-react";
import { useCallback, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { LetterView } from "@/components/letter/LetterView";
import { PrintGuide } from "@/components/share/PrintGuide";
import { Button } from "@/components/ui/button";
import type { SheetSide } from "@/lib/client/export-pdf";
import { useEditorStore } from "@/lib/editor/store";
import { PRINT_CONFIG } from "@/lib/print-config";
import { draftQrUrl } from "@/lib/render/qr";
import { Toggle } from "../ui";
import { EnvelopeFront, FoldedEnvelope } from "./FoldedEnvelope";
import { RenderedCanvas } from "./RenderedCanvas";

/** 6 px/mm: trang A4 xem trước 1260 x 1782 px, đủ nét mà nhẹ cho điện thoại. */
const SHEET_PX_PER_MM = 6;
const CARD_PIXEL_RATIO = 0.75;

const A4 = PRINT_CONFIG.PAPER_A4_MM;

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
  const recipientName = useEditorStore((s) => s.doc.web_config.recipientName);
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

  // Hai mặt giấy dùng chung một lần vẽ các lớp ảnh.
  const kit = useMemo(() => {
    let pending: Promise<(side: SheetSide) => HTMLCanvasElement> | undefined;
    return () =>
      (pending ??= (async () => {
        // Konva và hàm xuất nặng, chỉ tải khi mở màn hình này.
        const { renderPrintKit, composeSheetCanvas } = await import("@/lib/client/export-pdf");
        const layers = await renderPrintKit(
          { canvas, qrUrl, envelopeColor, recipientName, background: !hideBackground },
          { pxPerMm: SHEET_PX_PER_MM, cardPixelRatio: CARD_PIXEL_RATIO },
        );
        return (side: SheetSide) => composeSheetCanvas(layers, SHEET_PX_PER_MM, side);
      })());
  }, [canvas, qrUrl, envelopeColor, recipientName, hideBackground]);
  const drawFront = useCallback(async () => (await kit())("front"), [kit]);
  const drawBack = useCallback(async () => (await kit())("back"), [kit]);

  async function downloadDraft() {
    setExporting(true);
    setError(undefined);
    try {
      const { exportLetterPdf } = await import("@/lib/client/export-pdf");
      await exportLetterPdf({
        canvas,
        qrUrl,
        envelopeColor,
        recipientName,
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
          <Part title="Trang 1: mặt trước tờ giấy (phong bì và mặt trước thiệp)">
            <RenderedCanvas
              draw={drawFront}
              label="Xem trước trang 1: phong bì và mặt trước thiệp"
              ratio={A4.width / A4.height}
              className="border bg-white shadow-md"
            />
          </Part>
          <Part
            title="Trang 2: mặt sau tờ giấy (mặt sau thiệp)"
            note="In lên mặt sau của đúng tờ giấy trang 1, lật theo cạnh dài. Phần còn lại để trắng."
          >
            <RenderedCanvas
              draw={drawBack}
              label="Xem trước trang 2: mặt sau thiệp"
              ratio={A4.width / A4.height}
              className="border bg-white shadow-md"
            />
          </Part>
        </div>

        <div className="space-y-6">
          <Part title="Phong bì: mặt trước">
            <EnvelopeFront />
          </Part>
          <Part title="Phong bì: mặt sau (đã gấp, cài nắp)">
            <FoldedEnvelope />
          </Part>
          <Part title="Thiệp: mặt trước">
            <div className="overflow-hidden rounded-sm border shadow-sm">
              <LetterView face={canvas.faces.front} qrUrl={qrUrl} hideBackground={hideBackground} />
            </div>
          </Part>
          <Part title="Thiệp: mặt sau">
            <div className="overflow-hidden rounded-sm border shadow-sm">
              <LetterView face={canvas.faces.inside} qrUrl={qrUrl} hideBackground={hideBackground} />
            </div>
          </Part>
        </div>
      </div>
    </div>
  );
}
