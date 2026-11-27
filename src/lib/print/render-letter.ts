import type { LetterSheetConfig, PaperStyle, WritingPageConfig } from "@/types/letter";
import { drawIconMm, fillTextMm, fillWithBleed, loadFont, measureMm } from "./draw";
import { dotColumns, fitText, letterRows, MARGIN_X_MM, panelRows, resolveGreeting } from "./guides";
import { createPartCanvas, type PartRenderer, type RenderedPart } from "./parts";

const GUIDE_ALPHA = 0.28;
const TEXT_SIZE = { max: 6, min: 3.2, step: 0.2 };
const DECOR_MM = 9;

/** Dòng kẻ hoặc chấm bi. Vẫn in khi đã tắt nền, vì giấy màu cũng cần dòng để viết. */
function drawGuides(
  ctx: CanvasRenderingContext2D,
  paper: PaperStyle,
  width: number,
  rows: number[],
  color: string,
) {
  if (paper === "plain") return;
  ctx.save();
  ctx.globalAlpha = GUIDE_ALPHA;
  ctx.fillStyle = color;
  for (const y of rows) {
    if (paper === "ruled") {
      ctx.fillRect(MARGIN_X_MM, y, width - MARGIN_X_MM * 2, 0.18);
    } else {
      for (const x of dotColumns(width)) {
        ctx.beginPath();
        ctx.arc(x, y, 0.28, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

const result = (
  canvas: HTMLCanvasElement,
  size: { width: number; height: number },
  bleedMm: number,
  opaque: boolean,
): RenderedPart => ({ canvas, widthMm: size.width, heightMm: size.height, bleedMm, opaque });

/** Trang bên trái khi mở thiệp: chỗ để viết bút. */
export const renderWritingPage: PartRenderer<WritingPageConfig> = async (page, options) => {
  const { canvas, ctx, size, bleedMm } = createPartCanvas("writingPage", options);
  if (options.background) fillWithBleed(ctx, size, bleedMm, page.color);
  drawGuides(ctx, page.paper, size.width, panelRows(0), "#5C524B");
  return result(canvas, size, bleedMm, options.background);
};

/** Thư viết tay gấp 3: lời chào, chữ ký, phần giữa để trống (FR-11). */
export const renderLetterSheet: PartRenderer<{
  letter: LetterSheetConfig;
  recipient: string;
}> = async ({ letter, recipient }, options) => {
  const greeting = resolveGreeting(letter.greeting, recipient);
  const signature = letter.signature.trim();
  await loadFont(letter.fontFamily, `${greeting}${signature}`);

  const { canvas, ctx, size, bleedMm } = createPartCanvas("letter", options);
  if (options.background) fillWithBleed(ctx, size, bleedMm, letter.paperColor);

  const rows = letterRows(!!greeting, !!signature);
  drawGuides(ctx, letter.paper, size.width, rows.writing, letter.inkColor);

  // Chừa chỗ cho hoa văn ở góc.
  const textWidth = size.width - MARGIN_X_MM * 2 - (letter.decorIconId ? DECOR_MM + 2 : 0);
  const write = (text: string, y: number, align: "left" | "right") => {
    const fitted = fitText(text, [textWidth], TEXT_SIZE, (sizeMm) =>
      measureMm(ctx, options.pxPerMm, letter.fontFamily, sizeMm),
    );
    fillTextMm(ctx, options.pxPerMm, {
      text: fitted.lines[0],
      x: align === "left" ? MARGIN_X_MM : size.width - MARGIN_X_MM,
      y: y - 1,
      font: letter.fontFamily,
      sizeMm: fitted.size,
      color: letter.inkColor,
      align,
      maxWidth: textWidth,
    });
  };
  if (greeting) write(greeting, rows.greetingY, "left");
  if (signature) write(signature, rows.signatureY, "right");

  if (letter.decorIconId) {
    drawIconMm(
      ctx,
      letter.decorIconId,
      size.width - MARGIN_X_MM - DECOR_MM,
      3,
      DECOR_MM,
      letter.inkColor,
    );
    drawIconMm(
      ctx,
      letter.decorIconId,
      MARGIN_X_MM,
      size.height - DECOR_MM - 3,
      DECOR_MM,
      letter.inkColor,
    );
  }
  return result(canvas, size, bleedMm, options.background);
};
