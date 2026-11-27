// Đường gióng thông minh kiểu Canva (tọa độ logic của mặt thiệp). Phần tính thuần để test được.

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Guide {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** "align": đường gióng thẳng hàng; "gap": đoạn đánh dấu hai khoảng cách bằng nhau. */
  kind: "align" | "gap";
}

export interface SnapSpace {
  width: number;
  height: number;
  /** Lề an toàn. */
  margin: number;
}

type Axis = "x" | "y";

const sizeOf = (box: Box, axis: Axis) => (axis === "x" ? box.width : box.height);
const startOf = (box: Box, axis: Axis) => box[axis];
const endOf = (box: Box, axis: Axis) => box[axis] + sizeOf(box, axis);
const other = (axis: Axis): Axis => (axis === "x" ? "y" : "x");
/** Ba mốc của một khung trên một trục: cạnh đầu, tâm, cạnh cuối. */
const anchors = (box: Box, axis: Axis) => [
  startOf(box, axis),
  startOf(box, axis) + sizeOf(box, axis) / 2,
  endOf(box, axis),
];

/** Vạch của cả mặt thiệp: mép, lề an toàn và giữa. */
function canvasLines(space: SnapSpace, axis: Axis) {
  const size = axis === "x" ? space.width : space.height;
  return { edges: [0, space.margin, size - space.margin, size], center: size / 2 };
}

/** Hai vật nằm cùng "hàng" theo trục còn lại thì mới tính khoảng cách giữa chúng. */
const sameBand = (a: Box, b: Box, axis: Axis) =>
  startOf(a, other(axis)) < endOf(b, other(axis)) &&
  startOf(b, other(axis)) < endOf(a, other(axis));

/** Vật gần nhất nằm hẳn phía trước và phía sau trên trục `axis`. */
function neighbours(moving: Box, others: Box[], axis: Axis, slack: number) {
  const band = others.filter((box) => sameBand(moving, box, axis));
  const before = band
    .filter((box) => endOf(box, axis) <= startOf(moving, axis) + slack)
    .sort((a, b) => endOf(b, axis) - endOf(a, axis))[0];
  const after = band
    .filter((box) => startOf(box, axis) >= endOf(moving, axis) - slack)
    .sort((a, b) => startOf(a, axis) - startOf(b, axis))[0];
  return before && after ? { before, after } : undefined;
}

/** Độ dịch nhỏ nhất để khớp một mốc, trong ngưỡng hút; không có thì 0. */
function bestDelta(moving: Box, others: Box[], space: SnapSpace, axis: Axis, threshold: number) {
  let best: number | undefined;
  const offer = (delta: number) => {
    if (Math.abs(delta) <= threshold && (best === undefined || Math.abs(delta) < Math.abs(best))) {
      best = delta;
    }
  };
  const [start, middle, end] = anchors(moving, axis);
  const { edges, center } = canvasLines(space, axis);
  // Giữa mặt thiệp xét trước để thắng khi hai mốc cách đều.
  offer(center - middle);
  for (const line of edges) for (const point of [start, end]) offer(line - point);
  for (const box of others) {
    for (const line of anchors(box, axis)) for (const point of [start, middle, end]) offer(line - point);
  }
  const pair = neighbours(moving, others, axis, threshold);
  if (pair) {
    const gapBefore = start - endOf(pair.before, axis);
    const gapAfter = startOf(pair.after, axis) - end;
    offer((gapAfter - gapBefore) / 2);
  }
  return best ?? 0;
}

/** Các đường cần vẽ cho vị trí đã hút. */
function guidesFor(snapped: Box, others: Box[], space: SnapSpace, axis: Axis): Guide[] {
  const guides: Guide[] = [];
  const cross = other(axis);
  const crossSize = cross === "x" ? space.width : space.height;
  const line = (at: number, from: number, to: number, kind: Guide["kind"]): Guide =>
    axis === "x"
      ? { x1: at, y1: from, x2: at, y2: to, kind }
      : { x1: from, y1: at, x2: to, y2: at, kind };
  const same = (a: number, b: number) => Math.abs(a - b) < 0.5;
  const points = anchors(snapped, axis);
  const { edges, center } = canvasLines(space, axis);

  const drawn = new Set<number>();
  const add = (at: number, from: number, to: number) => {
    const key = Math.round(at);
    if (drawn.has(key)) return;
    drawn.add(key);
    guides.push(line(at, from, to, "align"));
  };
  if (same(points[1], center)) add(center, 0, crossSize);
  for (const at of edges) if (same(points[0], at) || same(points[2], at)) add(at, 0, crossSize);
  for (const box of others) {
    for (const at of anchors(box, axis)) {
      if (!points.some((point) => same(point, at))) continue;
      add(
        at,
        Math.min(startOf(box, cross), startOf(snapped, cross)),
        Math.max(endOf(box, cross), endOf(snapped, cross)),
      );
    }
  }

  const pair = neighbours(snapped, others, axis, 0.5);
  if (pair) {
    const gapBefore = points[0] - endOf(pair.before, axis);
    const gapAfter = startOf(pair.after, axis) - points[2];
    if (gapBefore > 0 && same(gapBefore, gapAfter)) {
      const at = startOf(snapped, cross) + sizeOf(snapped, cross) / 2;
      // Đoạn đánh dấu chạy dọc theo trục đang xét.
      const segment = (from: number, to: number): Guide =>
        axis === "x"
          ? { x1: from, y1: at, x2: to, y2: at, kind: "gap" }
          : { x1: at, y1: from, x2: at, y2: to, kind: "gap" };
      guides.push(segment(endOf(pair.before, axis), points[0]));
      guides.push(segment(points[2], startOf(pair.after, axis)));
    }
  }
  return guides;
}

/** Khi đang kéo: cần dịch thêm (dx, dy) để khớp, và vẽ những đường nào. */
export function computeSnap(moving: Box, others: Box[], space: SnapSpace, threshold: number) {
  const dx = bestDelta(moving, others, space, "x", threshold);
  const dy = bestDelta(moving, others, space, "y", threshold);
  const snapped = { ...moving, x: moving.x + dx, y: moving.y + dy };
  return {
    dx,
    dy,
    guides: [
      ...guidesFor(snapped, others, space, "x"),
      ...guidesFor(snapped, others, space, "y"),
    ],
  };
}

function snapValue(value: number, others: Box[], space: SnapSpace, axis: Axis, threshold: number) {
  const { edges, center } = canvasLines(space, axis);
  const lines = [center, ...edges, ...others.flatMap((box) => anchors(box, axis))];
  let best: number | undefined;
  for (const line of lines) {
    const distance = Math.abs(line - value);
    if (distance <= threshold && (best === undefined || distance < Math.abs(best - value))) {
      best = line;
    }
  }
  return best;
}

/**
 * Khi kéo giãn một nút của khung (chưa xoay): trả về vị trí nút sau khi hút.
 * `handle` là tên nút của Konva, ví dụ "top-left", "middle-right". Nút góc giữ tỷ lệ thì chỉ
 * hút một trục rồi tính trục kia theo đường chéo, để hình không bị méo.
 */
export function snapResizePoint(
  point: { x: number; y: number },
  handle: string,
  start: Box,
  keepRatio: boolean,
  others: Box[],
  space: SnapSpace,
  threshold: number,
): { x: number; y: number; guides: Guide[] } {
  const movesX = handle.includes("left") || handle.includes("right");
  const movesY = handle.includes("top") || handle.includes("bottom");
  const tx = movesX ? snapValue(point.x, others, space, "x", threshold) : undefined;
  const ty = movesY ? snapValue(point.y, others, space, "y", threshold) : undefined;
  let { x, y } = point;
  const lineX = (at: number): Guide => ({ x1: at, y1: 0, x2: at, y2: space.height, kind: "align" });
  const lineY = (at: number): Guide => ({ x1: 0, y1: at, x2: space.width, y2: at, kind: "align" });
  const guides: Guide[] = [];

  if (movesX && movesY && keepRatio) {
    // Góc đối diện đứng yên.
    const fixedX = handle.includes("left") ? start.x + start.width : start.x;
    const fixedY = handle.includes("top") ? start.y + start.height : start.y;
    const ratio = start.height / start.width;
    const signX = handle.includes("left") ? -1 : 1;
    const signY = handle.includes("top") ? -1 : 1;
    const useX =
      tx !== undefined && (ty === undefined || Math.abs(tx - point.x) <= Math.abs(ty - point.y));
    if (useX) {
      x = tx;
      y = fixedY + signY * Math.abs(tx - fixedX) * ratio;
      guides.push(lineX(tx));
    } else if (ty !== undefined) {
      y = ty;
      x = fixedX + (signX * Math.abs(ty - fixedY)) / ratio;
      guides.push(lineY(ty));
    }
  } else {
    if (tx !== undefined) {
      x = tx;
      guides.push(lineX(tx));
    }
    if (ty !== undefined) {
      y = ty;
      guides.push(lineY(ty));
    }
  }
  return { x, y, guides };
}
