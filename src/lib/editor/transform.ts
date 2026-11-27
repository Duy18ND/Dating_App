import { PRINT_CONFIG } from "@/lib/print-config";
import { TEXT_DEFAULTS } from "@/lib/render/text";
import type { CanvasElement } from "@/types/letter";

const MIN_BOX = 20;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number) => Math.round(value * 10) / 10;

/** Chọn hệ số giãn đồng đều theo trục biến đổi nhiều hơn để không bóp méo hình (FR-16). */
const uniformScale = (sx: number, sy: number) =>
  Math.abs(sx - 1) >= Math.abs(sy - 1) ? sx : sy;

/**
 * Đổi một lần kéo giãn (sx, sy) thành thay đổi dữ liệu. Konva chỉ đổi scale của node,
 * còn canvas_data luôn lưu kích thước thật với scale = 1.
 * Theo FR-16, mọi thành phần trừ vùng dòng kẻ (lined_area) đều giữ tỷ lệ khi kéo giãn.
 */
export function scalePatch(el: CanvasElement, sx: number, sy: number): Partial<CanvasElement> {
  sx = Math.abs(sx);
  sy = Math.abs(sy);
  switch (el.type) {
    case "text":
      return {
        width: round(clamp((el.width ?? TEXT_DEFAULTS.width) * sx, 60, 5000)),
        fontSize: round(
          clamp((el.fontSize ?? TEXT_DEFAULTS.fontSize) * sy, PRINT_CONFIG.CANVAS.minFontPx, 600),
        ),
      };
    case "handwriting": {
      const s = uniformScale(sx, sy);
      return {
        points: (el.points ?? []).map((value) => round(value * s)),
      };
    }
    case "qr_code": {
      const size = Math.max(
        (el.width ?? PRINT_CONFIG.CANVAS.defaultQrPx) * Math.max(sx, sy),
        PRINT_CONFIG.CANVAS.minQrPx,
      );
      return { width: round(size), height: round(size) };
    }
    case "lined_area":
      return {
        width: round(clamp((el.width ?? 100) * sx, MIN_BOX, 7000)),
        height: round(clamp((el.height ?? 100) * sy, MIN_BOX, 7000)),
      };
    default: {
      // image, sticker_img, svg_icon giữ đúng tỷ lệ gốc kể cả khi chạm ngưỡng min/max.
      const w0 = el.width ?? 100;
      const h0 = el.height ?? 100;
      const minScale = Math.max(MIN_BOX / w0, MIN_BOX / h0);
      const maxScale = Math.min(7000 / w0, 7000 / h0);
      const s = clamp(uniformScale(sx, sy), minScale, maxScale);
      return {
        width: round(w0 * s),
        height: round(h0 * s),
      };
    }
  }
}

const toRad = (deg: number) => (deg * Math.PI) / 180;
const rotate = (x: number, y: number, deg: number) => ({
  x: x * Math.cos(toRad(deg)) - y * Math.sin(toRad(deg)),
  y: x * Math.sin(toRad(deg)) + y * Math.cos(toRad(deg)),
});

/** Chuẩn hóa góc về khoảng (-180, 180] để qua validation (-360..360). */
export const normalizeAngle = (deg: number) => {
  const a = ((deg % 360) + 360) % 360;
  return round(a > 180 ? a - 360 : a);
};

/**
 * Phóng to và xoay quanh tâm (thao tác 2 ngón). `box` là kích thước khung chưa xoay lúc
 * bắt đầu cử chỉ; phần tử quay quanh góc trên trái (x, y) nên phải tính lại vị trí.
 */
export function pinchPatch(
  start: CanvasElement,
  box: { width: number; height: number },
  scale: number,
  deltaDeg: number,
): Partial<CanvasElement> {
  const size = scalePatch(start, scale, scale);
  const actual = start.type === "qr_code" ? (size.width ?? 0) / (start.width ?? 1) : scale;
  const rotation = normalizeAngle(start.rotation + deltaDeg);
  const center = rotate(box.width / 2, box.height / 2, start.rotation);
  const corner = rotate((box.width * actual) / 2, (box.height * actual) / 2, rotation);
  return {
    ...size,
    rotation,
    x: round(start.x + center.x - corner.x),
    y: round(start.y + center.y - corner.y),
  };
}
