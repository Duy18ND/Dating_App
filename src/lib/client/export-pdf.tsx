"use client";

import type Konva from "konva";
import { createRoot } from "react-dom/client";
import { PENDING } from "@/components/letter/ElementNode";
import LetterStage from "@/components/letter/LetterStage";
import { PRINT_CONFIG, type PrintSize } from "@/lib/print-config";
import { cardRect, cropMarks, envelopeC6, foldMarks, type Segment } from "@/lib/print/layout";
import type { CanvasData } from "@/types/letter";

const READY_TIMEOUT_MS = 20_000;
const INK: [number, number, number] = [43, 38, 35];
const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

/**
 * Vẽ lá thư trên một Stage riêng ngoài màn hình (scale 1, không có Transformer hay khung
 * lề an toàn) rồi chụp với pixelRatio 2 = 2480 x 3508 px.
 */
async function renderCard(canvas: CanvasData, qrUrl: string, hideBackground: boolean) {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = "position:fixed;left:-30000px;top:0;pointer-events:none;";
  document.body.append(host);
  const root = createRoot(host);
  try {
    const stage = await new Promise<Konva.Stage>((resolve) =>
      root.render(
        <LetterStage
          canvas={canvas}
          scale={1}
          qrUrl={qrUrl}
          hideBackground={hideBackground}
          listening={false}
          stageRef={(node) => {
            if (node) resolve(node);
          }}
        />,
      ),
    );
    // Chờ ảnh, mã QR và font tải xong.
    const deadline = Date.now() + READY_TIMEOUT_MS;
    while (stage.find(`.${PENDING}`).length > 0) {
      if (Date.now() > deadline) {
        throw new Error("Có ảnh chưa tải được. Hãy kiểm tra mạng rồi thử lại.");
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    await frame();
    await frame();
    // Ẩn nền thì phải giữ trong suốt (PNG); còn lại dùng JPEG cho file nhẹ.
    const format = hideBackground ? "PNG" : "JPEG";
    try {
      const dataUrl = stage.toDataURL({
        pixelRatio: PRINT_CONFIG.EXPORT_PIXEL_RATIO,
        mimeType: hideBackground ? "image/png" : "image/jpeg",
        quality: 0.95,
      });
      return { dataUrl, format };
    } catch {
      // Ảnh từ R2 thiếu CORS làm canvas bị "tainted".
      throw new Error(
        "Trình duyệt chặn ảnh khi xuất PDF. Hãy báo cho chủ trang kiểm tra CORS của kho ảnh.",
      );
    }
  } finally {
    root.unmount();
    host.remove();
  }
}

export async function exportLetterPdf(options: {
  canvas: CanvasData;
  qrUrl: string;
  size: PrintSize;
  hideBackground: boolean;
  fileName: string;
}) {
  const [{ jsPDF }, card] = await Promise.all([
    import("jspdf"),
    renderCard(options.canvas, options.qrUrl, options.hideBackground),
  ]);
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  pdf.setDrawColor(...INK);
  const draw = (segments: Segment[]) =>
    segments.forEach(([[x1, y1], [x2, y2]]) => pdf.line(x1, y1, x2, y2));

  // Trang 1: phôi phong bì C6, vẽ bằng vector. Nét liền = cắt, nét đứt = gấp.
  const envelope = envelopeC6();
  pdf.setLineWidth(0.3);
  pdf.setLineDashPattern([], 0);
  draw(envelope.cut.map((point, i) => [point, envelope.cut[(i + 1) % envelope.cut.length]]));
  pdf.setLineWidth(0.2);
  pdf.setLineDashPattern([2, 1.5], 0);
  draw(envelope.fold);

  // Trang 2: ruột thiệp là ảnh chụp Stage, đúng khổ A6/A5, kèm dấu cắt góc.
  pdf.addPage("a4", "portrait");
  const rect = cardRect(options.size);
  pdf.addImage(
    card.dataUrl,
    card.format,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    undefined,
    "FAST",
  );
  pdf.setLineDashPattern([], 0);
  pdf.setLineWidth(0.2);
  draw(cropMarks(rect));
  if (options.size === "A5") {
    pdf.setLineDashPattern([1.5, 1], 0);
    draw(foldMarks(rect));
  }
  pdf.save(options.fileName);
}
