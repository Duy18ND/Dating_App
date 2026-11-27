import { fontFamilyOf } from "@/components/letter/hooks";
import type { FontName } from "@/lib/font-names";
import { findIcon, ICON_VIEWBOX } from "@/lib/icons";
import type { Measure } from "./guides";

// Hàm vẽ Canvas 2D dùng chung cho các phần in. Chỉ chạy trên trình duyệt.
// Hệ trục của ctx tính bằng mm (xem createPartCanvas).

/** Canvas không tự chờ web font: phải tải xong trước khi đo và vẽ chữ. */
export async function loadFont(font: FontName, sample: string): Promise<void> {
  await document.fonts.load(`48px ${fontFamilyOf(font)}`, sample || "a").catch(() => []);
}

/**
 * Chạy `run` trong hệ trục pixel với font cỡ `sizeMm`. Đặt cỡ chữ theo pixel để tránh
 * trình duyệt làm tròn khi font chỉ vài đơn vị.
 */
function inPixels<T>(
  ctx: CanvasRenderingContext2D,
  pxPerMm: number,
  font: FontName,
  sizeMm: number,
  run: () => T,
): T {
  ctx.save();
  ctx.scale(1 / pxPerMm, 1 / pxPerMm);
  ctx.font = `${sizeMm * pxPerMm}px ${fontFamilyOf(font)}`;
  const result = run();
  ctx.restore();
  return result;
}

export const measureMm =
  (ctx: CanvasRenderingContext2D, pxPerMm: number, font: FontName, sizeMm: number): Measure =>
  (text) =>
    inPixels(ctx, pxPerMm, font, sizeMm, () => ctx.measureText(text).width / pxPerMm);

export function fillTextMm(
  ctx: CanvasRenderingContext2D,
  pxPerMm: number,
  options: {
    text: string;
    x: number;
    y: number;
    font: FontName;
    sizeMm: number;
    color: string;
    align?: CanvasTextAlign;
    maxWidth?: number;
  },
): void {
  inPixels(ctx, pxPerMm, options.font, options.sizeMm, () => {
    ctx.fillStyle = options.color;
    ctx.textAlign = options.align ?? "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(
      options.text,
      options.x * pxPerMm,
      options.y * pxPerMm,
      options.maxWidth === undefined ? undefined : options.maxWidth * pxPerMm,
    );
  });
}

/** Phủ màu cả vùng tràn, để cắt lệch một chút không lộ viền trắng. */
export function fillWithBleed(
  ctx: CanvasRenderingContext2D,
  size: { width: number; height: number },
  bleedMm: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(-bleedMm, -bleedMm, size.width + bleedMm * 2, size.height + bleedMm * 2);
}

export function drawIconMm(
  ctx: CanvasRenderingContext2D,
  iconId: string | undefined,
  x: number,
  y: number,
  sizeMm: number,
  color: string,
): void {
  const icon = findIcon(iconId);
  if (!icon) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sizeMm / ICON_VIEWBOX, sizeMm / ICON_VIEWBOX);
  const path = new Path2D(icon.d);
  if (icon.filled) {
    ctx.fillStyle = color;
    ctx.fill(path);
  } else {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke(path);
  }
  ctx.restore();
}
