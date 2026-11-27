import { describe, expect, it } from "vitest";
import { printKitLayout, type Point } from "./layout";
import { drawSheetVectors, SHEET_LINES, type LineStyle } from "./sheet";

describe("lớp vector dùng chung cho PDF và xem trước", () => {
  const paths: { points: Point[]; closed: boolean; style: LineStyle }[] = [];
  let circles = 0;
  drawSheetVectors({
    path: (points, closed, style) => paths.push({ points, closed, style }),
    circle: () => circles++,
  });
  const layout = printKitLayout();

  it("đúng một đường cắt kín là phôi phong bì, kèm khe cài nét liền", () => {
    const closed = paths.filter((p) => p.closed);
    expect(closed).toHaveLength(1);
    expect(closed[0].points).toEqual(layout.envelope.cut);
    expect(paths.find((p) => p.points.length === layout.envelope.slit.length)?.style).toBe(
      SHEET_LINES.cut,
    );
  });

  it("chỉ 4 nếp gấp là nét đứt", () => {
    const dashed = paths.filter((p) => p.style.dash.length > 0);
    expect(dashed.map((p) => p.points)).toEqual(layout.envelope.fold);
  });

  it("đủ 8 nét dấu cắt và biểu tượng kéo", () => {
    expect(paths.filter((p) => p.style === SHEET_LINES.mark)).toHaveLength(8);
    expect(circles).toBe(layout.scissors.length * 2);
  });
});
