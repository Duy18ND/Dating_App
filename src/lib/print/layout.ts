import { PRINT_CONFIG } from "@/lib/print-config";

// Hình học bản in, đơn vị mm trên A4 dọc. Mọi số đo lấy từ PRINT_CONFIG.
// v1.7: cả bộ nằm trên ĐÚNG 1 trang A4 in một mặt:
// - nửa trên: phôi phong bì C7 liền một mảnh có tai cài + khe cài,
// - nửa dưới: thiệp mini phẳng 105 x 74 mm.
// Bản in không có chữ hướng dẫn: chỉ nét cắt, nét gấp và vài biểu tượng nhỏ.

export type Point = [number, number];
export type Segment = [Point, Point];

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Số đoạn thẳng thay cho mỗi đường cong. Dùng chung cho nền màu và nét cắt nên hai lớp khít nhau. */
const CURVE_STEPS = 40;

function cubic(p0: Point, p1: Point, p2: Point, p3: Point, steps = CURVE_STEPS): Point[] {
  // Bỏ điểm đầu: điểm đó là điểm cuối của đoạn trước.
  return Array.from({ length: steps }, (_, i) => {
    const t = (i + 1) / steps;
    const u = 1 - t;
    const a = u * u * u;
    const b = 3 * u * u * t;
    const c = 3 * u * t * t;
    const d = t * t * t;
    return [
      a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
      a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
    ];
  });
}

function quadratic(p0: Point, p1: Point, p2: Point, steps = CURVE_STEPS): Point[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const u = 1 - t;
    return [
      u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
      u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
    ];
  });
}

export function bounds(points: Point[]): Rect {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

/** Điểm nằm trong đa giác (ray casting). */
export function insidePolygon([px, py]: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * Phôi phong bì C7 trải phẳng, liền một mảnh (144 x 188 mm, y = 10..198).
 *
 * Gấp: hai tai bên vào trước, nắp đáy lên đè lên tai bên (dính keo), nắp trên xuống
 * rồi cài tai vào khe trên nắp đáy. Mặt in là mặt ngoài phong bì.
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
  const cx = left + c.bodyWidth / 2;

  // Nắp trên: vòm bo tròn từ hai góc thân lên chân tai cài, rồi tai cài bo tròn ở đỉnh.
  const tab = c.tuckTab;
  const domeTop = c.offsetY + tab.height;
  const tabLeft = cx - tab.width / 2;
  const tabRight = cx + tab.width / 2;
  // Bézier bậc 3 có hai điểm điều khiển cùng tung độ: đỉnh cao đúng 3/4 khoảng cách đó.
  const tabControlY = domeTop - (tab.height * 4) / 3;
  const domeRise = top - domeTop;

  const cut: Point[] = [
    [left, top],
    ...cubic([left, top], [left, top - domeRise * 0.7], [tabLeft - 26, domeTop], [tabLeft, domeTop]),
    ...cubic([tabLeft, domeTop], [tabLeft, tabControlY], [tabRight, tabControlY], [tabRight, domeTop]),
    ...cubic(
      [tabRight, domeTop],
      [tabRight + 26, domeTop],
      [right, top - domeRise * 0.7],
      [right, top],
    ),
    [outerRight, top + c.sideFlapTaper],
    [outerRight, bottom - c.sideFlapTaper],
    [right, bottom],
    [right - c.bottomFlapTaper, flapBottom],
    [left + c.bottomFlapTaper, flapBottom],
    [left, bottom],
    [outerLeft, bottom - c.sideFlapTaper],
    [outerLeft, top + c.sideFlapTaper],
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

  // Khe cài: đường cắt cong nhẹ, rộng hơn tai cài 4 mm để cài êm.
  const slitY = bottom + c.tuckSlit.depth;
  const half = c.tuckSlit.width / 2;
  const slit = quadratic([cx - half, slitY + 1], [cx, slitY - 1], [cx + half, slitY + 1], 16);

  // Vùng keo trên tai bên. Khi gấp, điểm cách nếp gấp bên s mm và cao h mm trên nếp gấp đáy
  // bị nắp đáy che nếu s >= taper * h / bottomFlap (nắp đáy vát vào). Chừa 1,5 mm cho lệch tay.
  const glueTop = bottom - c.bottomFlap + c.glueInset;
  const glueBottom = bottom - c.glueInset;
  const covered = (h: number) => (c.bottomFlapTaper * h) / c.bottomFlap + 1.5;
  const outerGap = 2;
  const glueSide = (sign: -1 | 1, edge: number): Point[] => [
    [edge + sign * covered(bottom - glueBottom), glueBottom],
    [edge + sign * (c.sideFlap - outerGap), glueBottom],
    [edge + sign * (c.sideFlap - outerGap), glueTop],
    [edge + sign * covered(bottom - glueTop), glueTop],
  ];
  const glue = [glueSide(-1, left), glueSide(1, right)];

  return {
    cut,
    fold,
    slit,
    glue,
    body: { x: left, y: top, width: c.bodyWidth, height: c.bodyHeight } satisfies Rect,
    /** Vùng nắp trên (114 x 45) để đặt chữ trang trí đã xoay 180°. */
    topFlap: { x: left, y: c.offsetY, width: c.bodyWidth, height: c.topFlap } satisfies Rect,
    tab: { x: tabLeft, y: c.offsetY, width: tab.width, height: tab.height } satisfies Rect,
    slitY,
    /** Tung độ khe cài khi nắp đáy đã gấp lên, tính từ mép trên của thân. */
    foldedSlitFromTop: c.bodyHeight - c.tuckSlit.depth,
    /** Độ phủ của nắp đáy theo chiều cao h (mm) trên nếp gấp đáy, dùng cho test vùng keo. */
    bottomFlapInsetAt: (h: number) => (c.bottomFlapTaper * h) / c.bottomFlap,
  };
}

/** Thiệp mini phẳng 105 x 74 mm ở nửa dưới tờ A4. */
export function miniCard(): Rect {
  const { MINI_CARD_MM: at, CARD_FACE_MM: face } = PRINT_CONFIG;
  return { x: at.x, y: at.y, width: face.width, height: face.height };
}

/** Biểu tượng kéo nhỏ vẽ bằng nét (không phải chữ): hai vòng tay cầm và hai lưỡi bắt chéo. */
export function scissorsIcon(cx: number, cy: number, size = 4) {
  const r = size * 0.17;
  const handleX = cx - size * 0.32;
  const rings = [
    { x: handleX, y: cy - size * 0.22, r },
    { x: handleX, y: cy + size * 0.22, r },
  ];
  const tipX = cx + size * 0.5;
  const blades: Segment[] = [
    [
      [handleX + r * 0.8, cy - size * 0.12],
      [tipX, cy + size * 0.14],
    ],
    [
      [handleX + r * 0.8, cy + size * 0.12],
      [tipX, cy - size * 0.14],
    ],
  ];
  return { rings, blades, box: { x: cx - size / 2, y: cy - size / 2, width: size, height: size } };
}

/** Toàn bộ bố cục trang A4: phong bì, thiệp, dấu cắt và vị trí các biểu tượng kéo. */
export function printKitLayout() {
  const envelope = envelopeC7();
  const card = miniCard();
  const outline = bounds(envelope.cut);
  const scissors = [
    // Ngoài mép trái phong bì, ngang tai bên.
    scissorsIcon(outline.x - 6, envelope.body.y + 20),
    // Ngoài góc trên trái của thiệp, tránh dấu cắt.
    scissorsIcon(card.x - 7, card.y + 10),
    // Cạnh khe cài (nằm trên giấy phong bì).
    scissorsIcon(envelope.body.x + envelope.body.width / 2 - 13 - 4, envelope.slitY, 3),
  ];
  return { envelope, card, cardCropMarks: cropMarks(card), scissors };
}

/** Thư gấp 3 trên A4 và hai vạch gấp (theo trục y). (v1.7: chưa có trong PDF mặc định.) */
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
