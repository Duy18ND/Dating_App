import { printKitLayout, type Point } from "./layout";

// Lớp vector của các trang in. PDF (jsPDF) và bản xem trước (canvas) cùng gọi hàm này,
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

/** Ba trang in: phong bì (giấy riêng, một mặt) và hai mặt của tờ thiệp. */
export type PrintPage = "envelope" | "cardFront" | "cardBack";

/** Hai file PDF tải riêng, để bật in 2 mặt cho thiệp không kéo theo trang phong bì. */
export const PRINT_FILES = {
  envelope: ["envelope"],
  card: ["cardFront", "cardBack"],
} as const satisfies Record<string, readonly PrintPage[]>;
export type PrintFile = keyof typeof PRINT_FILES;

type Icons = ReturnType<typeof printKitLayout>["envelopeScissors"];

/** Biểu tượng kéo bằng nét mảnh, không dùng ký tự chữ. */
function drawScissors(pen: SheetPen, icons: Icons) {
  for (const icon of icons) {
    for (const ring of icon.rings) pen.circle(ring.x, ring.y, ring.r, SHEET_LINES.icon);
    for (const blade of icon.blades) pen.path(blade, false, SHEET_LINES.icon);
  }
}

export function drawPageVectors(page: PrintPage, pen: SheetPen, layout = printKitLayout()): void {
  // Mặt sau thiệp không có nét nào: cắt theo dấu ở mặt trước.
  if (page === "cardBack") return;
  if (page === "cardFront") {
    for (const segment of layout.cardCropMarks) pen.path(segment, false, SHEET_LINES.mark);
    drawScissors(pen, layout.cardScissors);
    return;
  }
  const { envelope } = layout;
  pen.path(envelope.cut, true, SHEET_LINES.cut);
  pen.path(envelope.slit, false, SHEET_LINES.cut);
  for (const segment of envelope.fold) pen.path(segment, false, SHEET_LINES.fold);
  drawScissors(pen, layout.envelopeScissors);
}
