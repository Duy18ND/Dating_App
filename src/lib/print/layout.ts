import { PRINT_CONFIG, type PrintSize } from "@/lib/print-config";

// Hình học của bản in, đơn vị mm trên giấy A4. Mọi số đo lấy từ PRINT_CONFIG.

export type Point = [number, number];
export type Segment = [Point, Point];

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const SIDE_FLAP_TAPER = 12; // tai bên vát vào ở hai đầu
const BOTTOM_FLAP_TAPER = 20; // đáy hẹp dần để không chồng lên tai bên

/** Phôi phong bì C6 trải phẳng: nét cắt (đường bao kín) và nét gấp (4 cạnh thân). */
export function envelopeC6() {
  const c = PRINT_CONFIG.ENVELOPE_C6_FLAT_MM;
  const left = c.marginX + c.sideFlap;
  const top = c.marginY + c.topFlap;
  const right = left + c.bodyWidth;
  const bottom = top + c.bodyHeight;
  const outerLeft = left - c.sideFlap;
  const outerRight = right + c.sideFlap;
  const flapBottom = bottom + c.bottomFlap;

  const cut: Point[] = [
    [left, top],
    [left + c.bodyWidth / 2, c.marginY], // đỉnh nắp tam giác
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

/** Vị trí ruột thiệp trên trang A4 (đã căn giữa sẵn trong PRINT_CONFIG). */
export function cardRect(size: PrintSize): Rect {
  const card = PRINT_CONFIG.CARD_SIZES_MM[size];
  return { x: card.offsetX, y: card.offsetY, width: card.width, height: card.height };
}

/** Dấu cắt 4 góc, nằm ngoài mép thiệp để không lộ ra sau khi cắt. */
export function cropMarks(rect: Rect, gap = 3, length = 6): Segment[] {
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

/** Thiệp A5 gấp đôi ngang giữa: hai vạch gấp ngắn ở ngoài mép trái và phải. */
export function foldMarks(rect: Rect, gap = 3, length = 6): Segment[] {
  const y = rect.y + rect.height / 2;
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
