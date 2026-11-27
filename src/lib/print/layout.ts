import { PRINT_CONFIG } from "@/lib/print-config";

// Hình học bản in, đơn vị mm trên A4 dọc. Mọi số đo lấy từ PRINT_CONFIG (SRS v1.3, mục 2.2).

export type Point = [number, number];
export type Segment = [Point, Point];

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const SIDE_FLAP_TAPER = 8; // tai bên vát vào ở hai đầu
const BOTTOM_FLAP_TAPER = 14; // nắp đáy hẹp dần để không chồng lên tai bên

/**
 * Phôi phong bì C7 trải phẳng: nét cắt (đường bao kín) và nét gấp (4 cạnh thân).
 * Nắp trên đang là tam giác; T-29 đổi sang đầu bo tròn và thêm vùng dán keo.
 */
export function envelopeC7() {
  const c = PRINT_CONFIG.ENVELOPE_C7_FLAT_MM;
  const left = c.offsetX + c.sideFlap;
  const top = c.offsetY + c.topFlap;
  const right = left + c.bodyWidth;
  const bottom = top + c.bodyHeight;
  const outerLeft = left - c.sideFlap;
  const outerRight = right + c.sideFlap;
  const flapBottom = bottom + c.bottomFlap;

  const cut: Point[] = [
    [left, top],
    [left + c.bodyWidth / 2, c.offsetY], // đỉnh nắp trên
    [right, top],
    [outerRight, top + SIDE_FLAP_TAPER],
    [outerRight, bottom - SIDE_FLAP_TAPER],
    [right, bottom],
    [right - BOTTOM_FLAP_TAPER, flapBottom],
    [left + BOTTOM_FLAP_TAPER, flapBottom],
    [left, bottom],
    [outerLeft, bottom - SIDE_FLAP_TAPER],
    [outerLeft, top + SIDE_FLAP_TAPER],
  ];
  const fold: Segment[] = [
    [
      [left, top],
      [right, top],
    ],
    [
      [right, top],
      [right, bottom],
    ],
    [
      [left, bottom],
      [right, bottom],
    ],
    [
      [left, top],
      [left, bottom],
    ],
  ];
  const body: Rect = { x: left, y: top, width: c.bodyWidth, height: c.bodyHeight };
  return { cut, fold, body };
}

export type StripSlot = "back" | "front" | "writing" | "inside";

/**
 * Hai dải thiệp gập trên A4. Mỗi dải nằm ngang dài 210 x 74 mm được xoay 90° theo chiều
 * kim đồng hồ để đứng dọc (74 x 210), nên nửa TRÁI của dải ngang nằm ở TRÊN.
 * - Dải ngoài [Bìa sau | Bìa trước]: trên = back, dưới = front.
 * - Dải trong [Trang viết tay | Lời mời]: trên = writing, dưới = inside.
 * Dán lưng hai dải (lật dải trong) thì mặt sau bìa trước là trang viết tay, mặt sau bìa sau
 * là trang Lời mời: mở thiệp như cuốn sách sẽ thấy [viết tay | lời mời].
 * Mọi mặt đều xoay cùng chiều kim đồng hồ 90° khi đặt vào ô.
 */
export function cardStrips() {
  const s = PRINT_CONFIG.CARD_STRIPS_MM;
  const half = s.length / 2;
  const strip = (x: number): Rect => ({ x, y: s.y, width: s.height, height: s.length });
  const outer = strip(s.marginX);
  const inner = strip(s.marginX + s.height + s.gap);
  const slot = (rect: Rect, upper: boolean): Rect => ({
    x: rect.x,
    y: upper ? rect.y : rect.y + half,
    width: rect.width,
    height: half,
  });
  const slots: Record<StripSlot, Rect> = {
    back: slot(outer, true),
    front: slot(outer, false),
    writing: slot(inner, true),
    inside: slot(inner, false),
  };
  return { outer, inner, slots };
}

/** Thư gấp 3 trên A4 và hai vạch gấp (theo trục y). */
export function letterSheet() {
  const l = PRINT_CONFIG.LETTER_MM;
  const rect: Rect = { x: l.offsetX, y: l.offsetY, width: l.width, height: l.height };
  const folds = [l.offsetY + l.panelHeight, l.offsetY + l.panelHeight * 2];
  return { rect, folds };
}

/** Dấu cắt 4 góc, nằm ngoài mép (và ngoài vùng tràn màu `gap`) để không lộ ra sau khi cắt. */
export function cropMarks(rect: Rect, gap = 3, length = 5): Segment[] {
  const xs = [rect.x, rect.x + rect.width];
  const ys = [rect.y, rect.y + rect.height];
  return xs.flatMap((x, i) =>
    ys.flatMap((y, j): Segment[] => {
      const dx = i === 0 ? -1 : 1;
      const dy = j === 0 ? -1 : 1;
      return [
        [
          [x + dx * gap, y],
          [x + dx * (gap + length), y],
        ],
        [
          [x, y + dy * gap],
          [x, y + dy * (gap + length)],
        ],
      ];
    }),
  );
}

/** Vạch gấp ngắn nằm ngoài hai mép trái, phải tại tung độ `y`. */
export function sideFoldMarks(rect: Rect, y: number, gap = 3, length = 5): Segment[] {
  return [
    [
      [rect.x - gap - length, y],
      [rect.x - gap, y],
    ],
    [
      [rect.x + rect.width + gap, y],
      [rect.x + rect.width + gap + length, y],
    ],
  ];
}
