import { printKitLayout, type Point } from "./layout";

// Lớp vector của trang in A4. PDF (jsPDF) và bản xem trước (canvas) cùng gọi hàm này,
// nên nét cắt, nét gấp, dấu cắt và biểu tượng luôn giống nhau (FR-13).

export interface LineStyle {
  /** Bề dày nét, mm. */
  width: number;
  /** Mẫu nét đứt (mm); mảng rỗng là nét liền. */
  dash: number[];
}

export interface SheetPen {
  path(points: Point[], closed: boolean, style: LineStyle): void;
  circle(x: number, y: number, radius: number, style: LineStyle): void;
}

export const SHEET_INK = "#2B2623";

export const SHEET_LINES = {
  cut: { width: 0.3, dash: [] },
  fold: { width: 0.2, dash: [1.5, 1] },
  mark: { width: 0.2, dash: [] },
  icon: { width: 0.18, dash: [] },
} satisfies Record<string, LineStyle>;

export function drawSheetVectors(pen: SheetPen, layout = printKitLayout()): void {
  const { envelope, cardCropMarks, scissors } = layout;
  pen.path(envelope.cut, true, SHEET_LINES.cut);
  pen.path(envelope.slit, false, SHEET_LINES.cut);
  for (const segment of envelope.fold) pen.path(segment, false, SHEET_LINES.fold);
  for (const segment of cardCropMarks) pen.path(segment, false, SHEET_LINES.mark);
  // Biểu tượng kéo bằng nét mảnh, không dùng ký tự chữ.
  for (const icon of scissors) {
    for (const ring of icon.rings) pen.circle(ring.x, ring.y, ring.r, SHEET_LINES.icon);
    for (const blade of icon.blades) pen.path(blade, false, SHEET_LINES.icon);
  }
}
