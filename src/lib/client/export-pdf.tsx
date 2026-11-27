"use client";

import type Konva from "konva";
import { createRoot } from "react-dom/client";
import { PENDING } from "@/components/letter/ElementNode";
import LetterStage from "@/components/letter/LetterStage";
import { PRINT_CONFIG } from "@/lib/print-config";
import {
  cardStrips,
  cropMarks,
  envelopeC7,
  letterSheet,
  sideFoldMarks,
  type Rect,
  type Segment,
} from "@/lib/print/layout";
import { PART_SIZE_MM, type RenderedPart } from "@/lib/print/parts";
import type { CanvasData, CardFace } from "@/types/letter";

const READY_TIMEOUT_MS = 20_000;
const INK: [number, number, number] = [43, 38, 35];
const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

/**
 * Vẽ một mặt thiệp trên Stage riêng ngoài màn hình (scale 1, không có Transformer hay khung lề
 * an toàn) rồi chụp với pixelRatio 2 = 3520 x 2480 px. Chưa có tràn màu (T-29).
 */
export async function renderCardFace(
  face: CardFace,
  qrUrl: string,
  background: boolean,
): Promise<RenderedPart> {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = "position:fixed;left:-30000px;top:0;pointer-events:none;";
  document.body.append(host);
  const root = createRoot(host);
  try {
    const stage = await new Promise<Konva.Stage>((resolve) =>
      root.render(
        <LetterStage
          face={face}
          scale={1}
          qrUrl={qrUrl}
          hideBackground={!background}
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
    try {
      const canvas = stage.toCanvas({ pixelRatio: PRINT_CONFIG.EXPORT_PIXEL_RATIO });
      const size = PART_SIZE_MM.cardFront;
      return { canvas, widthMm: size.width, heightMm: size.height, bleedMm: 0, opaque: background };
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

/** Xoay 90° theo chiều kim đồng hồ: ảnh ngang thành ảnh đứng để đặt vào dải thiệp trên A4. */
function rotateClockwise(source: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = source.height;
  canvas.height = source.width;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(canvas.width, 0);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(source, 0, 0);
  return canvas;
}

export async function exportLetterPdf(options: {
  canvas: CanvasData;
  qrUrl: string;
  /** false: bỏ nền các mặt thiệp để in lên giấy màu/Kraft. */
  cardBackground: boolean;
  fileName: string;
}) {
  const [{ jsPDF }, front, inside] = await Promise.all([
    import("jspdf"),
    renderCardFace(options.canvas.faces.front, options.qrUrl, options.cardBackground),
    renderCardFace(options.canvas.faces.inside, options.qrUrl, options.cardBackground),
  ]);
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  pdf.setDrawColor(...INK);
  const draw = (segments: Segment[]) =>
    segments.forEach(([[x1, y1], [x2, y2]]) => pdf.line(x1, y1, x2, y2));
  const solid = (width = 0.2) => {
    pdf.setLineWidth(width);
    pdf.setLineDashPattern([], 0);
  };
  const dashed = () => {
    pdf.setLineWidth(0.2);
    pdf.setLineDashPattern([1.5, 1], 0);
  };
  const place = (part: RenderedPart, slot: Rect) =>
    pdf.addImage(
      rotateClockwise(part.canvas),
      part.opaque ? "JPEG" : "PNG",
      slot.x,
      slot.y,
      slot.width,
      slot.height,
      undefined,
      "FAST",
    );

  // Trang 1: phong bì C7. Nét liền = cắt, nét đứt = gấp. (T-29: nắp bo tròn, vùng dán, chữ nắp.)
  const envelope = envelopeC7();
  solid(0.3);
  draw(envelope.cut.map((point, i) => [point, envelope.cut[(i + 1) % envelope.cut.length]]));
  dashed();
  draw(envelope.fold);

  // Trang 2: hai dải thiệp gập. (T-29/30/31: bìa sau, trang viết tay, tràn màu.)
  pdf.addPage("a4", "portrait");
  const { outer, inner, slots } = cardStrips();
  place(front, slots.front);
  place(inside, slots.inside);
  for (const strip of [outer, inner]) {
    solid();
    draw(cropMarks(strip));
    dashed();
    draw(sideFoldMarks(strip, strip.y + strip.height / 2));
  }

  // Trang 3: thư gấp 3. (T-30: dòng kẻ, lời chào, chữ ký.)
  pdf.addPage("a4", "portrait");
  const letter = letterSheet();
  solid();
  draw(cropMarks(letter.rect));
  dashed();
  for (const y of letter.folds) draw(sideFoldMarks(letter.rect, y));

  pdf.save(options.fileName);
}
