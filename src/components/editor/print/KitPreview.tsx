"use client";

import { useCallback, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { LetterView } from "@/components/letter/LetterView";
import { PrintDownloads } from "@/components/share/PrintDownloads";
import { PrintGuide } from "@/components/share/PrintGuide";
import { useEditorStore } from "@/lib/editor/store";
import { PRINT_CONFIG } from "@/lib/print-config";
import type { PrintPage } from "@/lib/print/sheet";
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
  const input = useMemo(
    () => ({ canvas, qrUrl, envelopeColor, recipientName, background: !hideBackground }),
    [canvas, qrUrl, envelopeColor, recipientName, hideBackground],
  );

  // Ba trang dùng chung một lần vẽ các lớp ảnh.
  const kit = useMemo(() => {
    let pending: Promise<(page: PrintPage) => HTMLCanvasElement> | undefined;
    return () =>
      (pending ??= (async () => {
        // Konva và hàm xuất nặng, chỉ tải khi mở màn hình này.
        const { renderPrintKit, composeSheetCanvas } = await import("@/lib/client/export-pdf");
        const layers = await renderPrintKit(input, {
          pxPerMm: SHEET_PX_PER_MM,
          cardPixelRatio: CARD_PIXEL_RATIO,
        });
        return (page: PrintPage) => composeSheetCanvas(layers, SHEET_PX_PER_MM, page);
      })());
  }, [input]);
  const drawEnvelope = useCallback(async () => (await kit())("envelope"), [kit]);
  const drawFront = useCallback(async () => (await kit())("cardFront"), [kit]);
  const drawBack = useCallback(async () => (await kit())("cardBack"), [kit]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-canvas p-3 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-6">
      <div className="mx-auto grid max-w-5xl items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-4">
          <div className="space-y-3 rounded-lg border bg-card p-3">
            <PrintDownloads input={input} name="thu" />
            <p className="rounded-md bg-accent p-2 text-xs">
              <strong>Bản thử để kiểm tra khổ giấy:</strong> mã QR mở trang mẫu, chưa phải thư của
              bạn. Muốn tặng thật, hãy bấm Xuất bản rồi tải PDF ở cửa sổ hiện ra.
            </p>
            <Toggle
              label="Ẩn nền phong bì và thiệp khi in (giấy Kraft hoặc giấy màu)"
              checked={hideBackground}
              onChange={setHideBackground}
            />
            <PrintGuide />
          </div>
          <Part title="File phong bì (giấy 120–160 gsm, in 1 mặt)">
            <RenderedCanvas
              draw={drawEnvelope}
              label="Xem trước trang phong bì"
              ratio={A4.width / A4.height}
              className="border bg-white shadow-md"
            />
          </Part>
          <div className="grid gap-4 sm:grid-cols-2">
            <Part title="File thiệp, trang 1: mặt trước">
              <RenderedCanvas
                draw={drawFront}
                label="Xem trước trang mặt trước thiệp"
                ratio={A4.width / A4.height}
                className="border bg-white shadow-md"
              />
            </Part>
            <Part title="File thiệp, trang 2: mặt sau">
              <RenderedCanvas
                draw={drawBack}
                label="Xem trước trang mặt sau thiệp"
                ratio={A4.width / A4.height}
                className="border bg-white shadow-md"
              />
            </Part>
          </div>
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
