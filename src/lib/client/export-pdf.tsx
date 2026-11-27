"use client";

import type Konva from "konva";
import { createRoot } from "react-dom/client";
import { PENDING } from "@/components/letter/ElementNode";
import LetterStage from "@/components/letter/LetterStage";
import { PRINT_CONFIG } from "@/lib/print-config";
import { miniCardBack, printKitLayout, type Point, type Rect } from "@/lib/print/layout";
import { PART_SIZE_MM, PRINT_PX_PER_MM, type RenderedPart } from "@/lib/print/parts";
import { renderEnvelopeSheet } from "@/lib/print/render-envelope";
import { drawSheetVectors, SHEET_INK, type LineStyle } from "@/lib/print/sheet";
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
  /** Bản xem trước dùng tỉ lệ nhỏ hơn cho nhẹ; PDF luôn dùng mặc định (pixelRatio 2). */
  pixelRatio: number = PRINT_CONFIG.EXPORT_PIXEL_RATIO,
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
      const canvas = stage.toCanvas({ pixelRatio });
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

export interface PrintKitInput {
  canvas: CanvasData;
  qrUrl: string;
  /** Màu phong bì, dùng chung cho web và bản in. */
  envelopeColor: string;
  /** Tên người nhận, in ở mặt trước phong bì. */
  recipientName: string;
  /** false: bỏ nền phong bì và thiệp để in lên giấy màu/Kraft. */
  background: boolean;
}

/** Vùng đặt ảnh thiệp trên A4, gồm tràn màu. */
const withBleedArea = ({ x, y, width, height }: Rect): Rect => ({
  x: x - PRINT_CONFIG.BLEED_MM,
  y: y - PRINT_CONFIG.BLEED_MM,
  width: width + PRINT_CONFIG.BLEED_MM * 2,
  height: height + PRINT_CONFIG.BLEED_MM * 2,
});

/** Các lớp ảnh của hai mặt giấy. PDF và bản xem trước chỉ khác độ phân giải. */
export async function renderPrintKit(
  input: PrintKitInput,
  quality: { pxPerMm: number; cardPixelRatio?: number } = { pxPerMm: PRINT_PX_PER_MM },
) {
  const bleed = PRINT_CONFIG.BLEED_MM;
  const face = (side: CardFace) =>
    renderCardFace(side, input.qrUrl, input.background, quality.cardPixelRatio).then((part) =>
      withEdgeBleed(part, bleed),
    );
  const [front, back, envelope] = await Promise.all([
    face(input.canvas.faces.front),
    face(input.canvas.faces.inside),
    renderEnvelopeSheet(
      {
        decor: input.canvas.envelope,
        color: input.envelopeColor,
        recipient: input.recipientName,
      },
      { pxPerMm: quality.pxPerMm, background: input.background, bleedMm: bleed },
    ),
  ]);
  return {
    envelope,
    front: { part: front, area: withBleedArea(printKitLayout().card) },
    back: { part: back, area: withBleedArea(miniCardBack()) },
  };
}

export type SheetSide = "front" | "back";

/** Ghép một mặt của tờ A4 lên canvas, đúng thứ tự lớp như trong PDF. */
export function composeSheetCanvas(
  kit: Awaited<ReturnType<typeof renderPrintKit>>,
  pxPerMm: number,
  side: SheetSide,
): HTMLCanvasElement {
  const paper = PRINT_CONFIG.PAPER_A4_MM;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(paper.width * pxPerMm);
  canvas.height = Math.round(paper.height * pxPerMm);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(pxPerMm, pxPerMm);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, paper.width, paper.height);
  const { part, area } = kit[side];
  const placeCard = () => ctx.drawImage(part.canvas, area.x, area.y, area.width, area.height);
  if (side === "back") {
    placeCard();
    return canvas;
  }
  const sheet = kit.envelope.area;
  ctx.drawImage(kit.envelope.canvas, sheet.x, sheet.y, sheet.width, sheet.height);
  placeCard();

  ctx.strokeStyle = SHEET_INK;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const stroke = (style: LineStyle) => {
    ctx.lineWidth = style.width;
    ctx.setLineDash(style.dash);
    ctx.stroke();
  };
  drawSheetVectors({
    path: (points, closed, style) => {
      ctx.beginPath();
      points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      if (closed) ctx.closePath();
      stroke(style);
    },
    circle: (x, y, radius, style) => {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      stroke(style);
    },
  });
  return canvas;
}

/**
 * Bộ in v1.8: ĐÚNG 1 tờ A4 in hai mặt (PDF 2 trang, in đảo theo cạnh dài).
 * - Trang 1: phong bì C7 (nửa trên) và mặt trước thiệp (nửa dưới), kèm mọi nét cắt, gấp.
 * - Trang 2: chỉ mặt sau thiệp (có QR), nằm đúng sau lưng mặt trước.
 * Không có chữ hướng dẫn trên giấy: chỉ nét cắt (liền), nét gấp (đứt), dấu cắt góc và biểu
 * tượng kéo / giọt keo. Hướng dẫn lắp ráp nằm trên web.
 */
export async function exportLetterPdf(options: PrintKitInput & { fileName: string }) {
  const [{ jsPDF }, kit] = await Promise.all([import("jspdf"), renderPrintKit(options)]);
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });

  // Lớp ảnh: phôi phong bì (nền + vùng keo + chữ nắp) và thiệp đã có tràn màu.
  const env = kit.envelope.area;
  pdf.addImage(kit.envelope.canvas, "JPEG", env.x, env.y, env.width, env.height, undefined, "FAST");
  const placeCard = ({ part, area }: (typeof kit)["front"]) =>
    pdf.addImage(
      part.canvas,
      part.opaque ? "JPEG" : "PNG",
      area.x,
      area.y,
      area.width,
      area.height,
      undefined,
      "FAST",
    );
  placeCard(kit.front);

  // Lớp vector đè lên.
  pdf.setDrawColor(...INK);
  pdf.setLineCap("round");
  pdf.setLineJoin("round");
  const applyStyle = (style: LineStyle) => {
    pdf.setLineWidth(style.width);
    pdf.setLineDashPattern(style.dash, 0);
  };
  drawSheetVectors({
    path: (points: Point[], closed, style) => {
      applyStyle(style);
      const [[x0, y0], ...rest] = points;
      let [px, py] = [x0, y0];
      const deltas = rest.map(([x, y]) => {
        const delta = [x - px, y - py];
        [px, py] = [x, y];
        return delta;
      });
      pdf.lines(deltas, x0, y0, [1, 1], "S", closed);
    },
    circle: (x, y, radius, style) => {
      applyStyle(style);
      pdf.circle(x, y, radius, "S");
    },
  });

  // Mặt sau không có nét nào: cắt theo dấu ở trang 1.
  pdf.addPage("a4", "portrait");
  placeCard(kit.back);

  pdf.save(options.fileName);
}
