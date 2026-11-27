"use client";

import type Konva from "konva";
import { createRoot } from "react-dom/client";
import { PENDING } from "@/components/letter/ElementNode";
import LetterStage from "@/components/letter/LetterStage";
import { PRINT_CONFIG } from "@/lib/print-config";
import { miniCardBack, printKitLayout, type Point, type Rect } from "@/lib/print/layout";
import { PART_SIZE_MM, PRINT_PX_PER_MM, type RenderedPart } from "@/lib/print/parts";
import { renderEnvelopeSheet } from "@/lib/print/render-envelope";
import {
  drawPageVectors,
  PRINT_FILES,
  SHEET_INK,
  type LineStyle,
  type PrintFile,
  type PrintPage,
} from "@/lib/print/sheet";
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

async function renderEnvelopeLayer(input: PrintKitInput, pxPerMm: number) {
  return renderEnvelopeSheet(
    { decor: input.canvas.envelope, color: input.envelopeColor, recipient: input.recipientName },
    { pxPerMm, background: input.background, bleedMm: PRINT_CONFIG.BLEED_MM },
  );
}

async function renderCardLayers(input: PrintKitInput, pixelRatio?: number) {
  const face = (side: CardFace) =>
    renderCardFace(side, input.qrUrl, input.background, pixelRatio).then((part) =>
      withEdgeBleed(part, PRINT_CONFIG.BLEED_MM),
    );
  const [front, back] = await Promise.all([
    face(input.canvas.faces.front),
    face(input.canvas.faces.inside),
  ]);
  return {
    cardFront: { part: front, area: withBleedArea(printKitLayout().card) },
    cardBack: { part: back, area: withBleedArea(miniCardBack()) },
  };
}

type Layers = Partial<
  { envelope: Awaited<ReturnType<typeof renderEnvelopeLayer>> } & Awaited<
    ReturnType<typeof renderCardLayers>
  >
>;

/** Mọi lớp ảnh của cả ba trang, cho bản xem trước. PDF chỉ khác độ phân giải. */
export async function renderPrintKit(
  input: PrintKitInput,
  quality: { pxPerMm: number; cardPixelRatio?: number } = { pxPerMm: PRINT_PX_PER_MM },
): Promise<Layers> {
  const [envelope, cards] = await Promise.all([
    renderEnvelopeLayer(input, quality.pxPerMm),
    renderCardLayers(input, quality.cardPixelRatio),
  ]);
  return { envelope, ...cards };
}

/** Ảnh của một trang và chỗ đặt nó trên A4 (mm). */
function pageImage(layers: Layers, page: PrintPage) {
  if (page === "envelope") {
    const sheet = layers.envelope!;
    return { canvas: sheet.canvas, area: sheet.area, opaque: true };
  }
  const { part, area } = layers[page]!;
  return { canvas: part.canvas, area, opaque: part.opaque };
}

/** Ghép một trang A4 lên canvas, đúng thứ tự lớp như trong PDF. */
export function composeSheetCanvas(layers: Layers, pxPerMm: number, page: PrintPage) {
  const paper = PRINT_CONFIG.PAPER_A4_MM;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(paper.width * pxPerMm);
  canvas.height = Math.round(paper.height * pxPerMm);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(pxPerMm, pxPerMm);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, paper.width, paper.height);
  const image = pageImage(layers, page);
  const { x, y, width, height } = image.area;
  ctx.drawImage(image.canvas, x, y, width, height);

  ctx.strokeStyle = SHEET_INK;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const stroke = (style: LineStyle) => {
    ctx.lineWidth = style.width;
    ctx.setLineDash(style.dash);
    ctx.stroke();
  };
  drawPageVectors(page, {
    path: (points, closed, style) => {
      ctx.beginPath();
      points.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
      if (closed) ctx.closePath();
      stroke(style);
    },
    circle: (cx, cy, radius, style) => {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      stroke(style);
    },
  });
  return canvas;
}

/**
 * Xuất MỘT trong hai file của bộ in (v1.9):
 * - "envelope": 1 trang, phong bì C7 có tai cài và khe cài, in một mặt trên giấy phong bì.
 * - "card": 2 trang là hai mặt của tờ thiệp (in 2 mặt trên bìa dày); thiệp ở giữa trang.
 * Tách hai file để bật in 2 mặt không ghép phong bì vào cùng tờ với thiệp.
 * Không có chữ hướng dẫn trên giấy: chỉ nét cắt, nét gấp, dấu cắt góc và biểu tượng.
 */
export async function exportPrintPdf(
  options: PrintKitInput & { file: PrintFile; fileName: string },
) {
  const [{ jsPDF }, layers] = await Promise.all([
    import("jspdf"),
    options.file === "envelope"
      ? renderEnvelopeLayer(options, PRINT_PX_PER_MM).then((envelope): Layers => ({ envelope }))
      : renderCardLayers(options),
  ]);
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  const applyStyle = (style: LineStyle) => {
    pdf.setLineWidth(style.width);
    pdf.setLineDashPattern(style.dash, 0);
  };

  PRINT_FILES[options.file].forEach((page: PrintPage, index) => {
    if (index > 0) pdf.addPage("a4", "portrait");
    const image = pageImage(layers, page);
    const { x, y, width, height } = image.area;
    pdf.addImage(image.canvas, image.opaque ? "JPEG" : "PNG", x, y, width, height, undefined, "FAST");

    // Lớp vector đè lên.
    pdf.setDrawColor(...INK);
    pdf.setLineCap("round");
    pdf.setLineJoin("round");
    drawPageVectors(page, {
      path: (points: Point[], closed, style) => {
        applyStyle(style);
        const [[x0, y0], ...rest] = points;
        let [px, py] = [x0, y0];
        const deltas = rest.map(([nx, ny]) => {
          const delta = [nx - px, ny - py];
          [px, py] = [nx, ny];
          return delta;
        });
        pdf.lines(deltas, x0, y0, [1, 1], "S", closed);
      },
      circle: (cx, cy, radius, style) => {
        applyStyle(style);
        pdf.circle(cx, cy, radius, "S");
      },
    });
  });

  pdf.save(options.fileName);
}
