"use client";

import type Konva from "konva";
import { createRoot } from "react-dom/client";
import { PENDING } from "@/components/letter/ElementNode";
import LetterStage from "@/components/letter/LetterStage";
import { PRINT_CONFIG } from "@/lib/print-config";
import { printKitLayout, type Point, type Segment } from "@/lib/print/layout";
import { PART_SIZE_MM, PRINT_PX_PER_MM, type RenderedPart } from "@/lib/print/parts";
import { renderEnvelopeSheet } from "@/lib/print/render-envelope";
import type { CanvasData, CardFace } from "@/types/letter";

const READY_TIMEOUT_MS = 20_000;
const INK: [number, number, number] = [43, 38, 35];
const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

/**
 * Vẽ một mặt thiệp trên Stage riêng ngoài màn hình (scale 1, không có Transformer hay khung lề
 * an toàn) rồi chụp với pixelRatio 2 = 3520 x 2480 px.
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
      const size = PART_SIZE_MM.cardInside;
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

/**
 * Thêm tràn màu cho ảnh chụp Stage bằng cách kéo giãn hàng/cột điểm ảnh ở mép ra ngoài.
 * Nền màu, nền hoa văn và ảnh tràn lề đều liền mạch qua đường cắt.
 */
export function withEdgeBleed(part: RenderedPart, bleedMm: number): RenderedPart {
  const source = part.canvas;
  const pad = Math.round((bleedMm * source.width) / part.widthMm);
  if (pad <= 0) return part;
  const canvas = document.createElement("canvas");
  canvas.width = source.width + pad * 2;
  canvas.height = source.height + pad * 2;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  const w = source.width;
  const h = source.height;
  ctx.drawImage(source, pad, pad);
  // Bốn cạnh: kéo giãn 1 px ở mép ra bề dày `pad`.
  ctx.drawImage(source, 0, 0, w, 1, pad, 0, w, pad);
  ctx.drawImage(source, 0, h - 1, w, 1, pad, pad + h, w, pad);
  ctx.drawImage(source, 0, 0, 1, h, 0, pad, pad, h);
  ctx.drawImage(source, w - 1, 0, 1, h, pad + w, pad, pad, h);
  // Bốn góc: màu điểm ảnh góc.
  const corners: [number, number, number, number][] = [
    [0, 0, 0, 0],
    [w - 1, 0, pad + w, 0],
    [0, h - 1, 0, pad + h],
    [w - 1, h - 1, pad + w, pad + h],
  ];
  for (const [sx, sy, dx, dy] of corners) ctx.drawImage(source, sx, sy, 1, 1, dx, dy, pad, pad);
  return { ...part, canvas, bleedMm };
}

/**
 * Bộ in v1.7: ĐÚNG 1 trang A4 in một mặt.
 * - Nửa trên: phôi phong bì C7 có tai cài và khe cài.
 * - Nửa dưới: thiệp mini 105 x 74 mm (trang Lời mời có QR); mặt sau để trắng viết tay.
 * Không có chữ hướng dẫn trên giấy: chỉ nét cắt (liền), nét gấp (đứt), dấu cắt góc và biểu
 * tượng kéo / giọt keo. Hướng dẫn lắp ráp nằm trên web.
 */
export async function exportLetterPdf(options: {
  canvas: CanvasData;
  qrUrl: string;
  /** Màu phong bì, dùng chung cho web và bản in. */
  envelopeColor: string;
  /** false: bỏ nền phong bì và thiệp để in lên giấy màu/Kraft. */
  background: boolean;
  fileName: string;
}) {
  const bleed = PRINT_CONFIG.BLEED_MM;
  const [{ jsPDF }, card, envelopeSheet] = await Promise.all([
    import("jspdf"),
    renderCardFace(options.canvas.faces.inside, options.qrUrl, options.background),
    renderEnvelopeSheet(
      { decor: options.canvas.envelope, color: options.envelopeColor },
      { pxPerMm: PRINT_PX_PER_MM, background: options.background, bleedMm: bleed },
    ),
  ]);
  const layout = printKitLayout();
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });

  // Lớp ảnh: phôi phong bì (nền + vùng keo + chữ nắp) và thiệp đã có tràn màu.
  const env = envelopeSheet.area;
  pdf.addImage(envelopeSheet.canvas, "JPEG", env.x, env.y, env.width, env.height, undefined, "FAST");
  const bled = withEdgeBleed(card, bleed);
  const { card: slot } = layout;
  pdf.addImage(
    bled.canvas,
    bled.opaque ? "JPEG" : "PNG",
    slot.x - bleed,
    slot.y - bleed,
    slot.width + bleed * 2,
    slot.height + bleed * 2,
    undefined,
    "FAST",
  );

  // Lớp vector đè lên.
  pdf.setDrawColor(...INK);
  pdf.setLineCap("round");
  pdf.setLineJoin("round");
  const solid = (width: number) => {
    pdf.setLineWidth(width);
    pdf.setLineDashPattern([], 0);
  };
  const dashed = () => {
    pdf.setLineWidth(0.2);
    pdf.setLineDashPattern([1.5, 1], 0);
  };
  const path = (points: Point[], closed: boolean) => {
    const [[x0, y0], ...rest] = points;
    let [px, py] = [x0, y0];
    const deltas = rest.map(([x, y]) => {
      const delta = [x - px, y - py];
      [px, py] = [x, y];
      return delta;
    });
    pdf.lines(deltas, x0, y0, [1, 1], "S", closed);
  };
  const draw = (segments: Segment[]) =>
    segments.forEach(([[x1, y1], [x2, y2]]) => pdf.line(x1, y1, x2, y2));

  const { envelope } = layout;
  solid(0.3);
  path(envelope.cut, true);
  path(envelope.slit, false);
  dashed();
  draw(envelope.fold);

  solid(0.2);
  draw(layout.cardCropMarks);

  // Biểu tượng kéo bằng nét mảnh, không dùng ký tự chữ.
  solid(0.18);
  for (const icon of layout.scissors) {
    for (const ring of icon.rings) pdf.circle(ring.x, ring.y, ring.r, "S");
    draw(icon.blades);
  }

  pdf.save(options.fileName);
}
