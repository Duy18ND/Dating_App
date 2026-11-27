import { PRINT_CONFIG } from "@/lib/print-config";
import type { PaperStyle } from "@/types/letter";

// Phần tính toán thuần của trang viết tay và thư gấp 3 (đơn vị mm), tách khỏi canvas để test.

const { panelHeight: PANEL, lineGap: GAP } = PRINT_CONFIG.LETTER_MM;
/** Lề trái/phải và khoảng chừa trên/dưới mỗi ô, để dòng kẻ không đè mép cắt và vạch gấp. */
export const MARGIN_X_MM = 8;
export const MARGIN_Y_MM = 5;
export const DOT_STEP_MM = 5;

/** Tung độ các dòng viết trong một ô 105 x 74 bắt đầu từ `top`. */
export function panelRows(top: number): number[] {
  const rows: number[] = [];
  for (let y = top + MARGIN_Y_MM + GAP; y <= top + PANEL - MARGIN_Y_MM; y += GAP) rows.push(y);
  return rows;
}

/**
 * Dòng viết của cả thư gấp 3. Lời chào chiếm dòng đầu tiên, chữ ký chiếm dòng cuối cùng;
 * để trống thì chỗ đó vẫn là dòng kẻ để viết bút.
 */
export function letterRows(hasGreeting: boolean, hasSignature: boolean) {
  const panels = Array.from({ length: PRINT_CONFIG.LETTER_MM.height / PANEL }, (_, i) =>
    panelRows(i * PANEL),
  );
  const all = panels.flat();
  return {
    greetingY: all[0],
    signatureY: all[all.length - 1],
    writing: all.slice(hasGreeting ? 1 : 0, hasSignature ? -1 : undefined),
  };
}

/** Hoành độ các chấm của giấy chấm bi, canh đều trong lề. */
export function dotColumns(width: number): number[] {
  const usable = width - MARGIN_X_MM * 2;
  const count = Math.floor(usable / DOT_STEP_MM);
  const start = MARGIN_X_MM + (usable - count * DOT_STEP_MM) / 2;
  return Array.from({ length: count + 1 }, (_, i) => start + i * DOT_STEP_MM);
}

export const hasGuides = (paper: PaperStyle) => paper !== "plain";

/**
 * Lời chào mặc định "Gửi" tự thêm tên người nhận. Người dùng đã sửa thì giữ nguyên;
 * để trống thì không in gì.
 */
export function resolveGreeting(greeting: string, recipient: string): string {
  const text = greeting.trim();
  return text === "Gửi" && recipient.trim() ? `Gửi ${recipient.trim()},` : text;
}

export type Measure = (text: string) => number;

/** Xuống dòng theo từ, mỗi dòng có bề rộng tối đa riêng. Trả null nếu không vừa số dòng. */
export function wrapWords(text: string, maxWidths: number[], measure: Measure): string[] | null {
  const lines: string[] = [];
  let line = "";
  for (const word of text.trim().split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (measure(next) <= maxWidths[lines.length]) {
      line = next;
      continue;
    }
    if (!line || lines.length + 1 >= maxWidths.length) return null;
    lines.push(line);
    if (measure(word) > maxWidths[lines.length]) return null;
    line = word;
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Giảm cỡ chữ tới khi vừa. Tới cỡ nhỏ nhất mà vẫn không vừa thì trả cả đoạn trên một dòng;
 * nơi vẽ truyền maxWidth cho fillText để nén lại.
 */
export function fitText(
  text: string,
  maxWidths: number[],
  sizes: { max: number; min: number; step: number },
  measureAt: (size: number) => Measure,
): { size: number; lines: string[] } {
  for (let size = sizes.max; size >= sizes.min - 1e-9; size -= sizes.step) {
    const lines = wrapWords(text, maxWidths, measureAt(size));
    if (lines) return { size, lines };
  }
  return { size: sizes.min, lines: [text.trim()] };
}

/** Bề rộng nắp phong bì tam giác tại độ sâu `y` tính từ chân nắp. */
export function flapWidthAt(y: number): number {
  const { bodyWidth, topFlap } = PRINT_CONFIG.ENVELOPE_C7_FLAT_MM;
  return Math.max(0, bodyWidth * (1 - y / topFlap));
}
