import { describe, expect, it } from "vitest";
import { printKitLayout, type Point } from "./layout";
import { drawPageVectors, PRINT_FILES, SHEET_LINES, type LineStyle, type PrintPage } from "./sheet";

function record(page: PrintPage) {
  const paths: { points: Point[]; closed: boolean; style: LineStyle }[] = [];
  let circles = 0;
  drawPageVectors(page, {
    path: (points, closed, style) => paths.push({ points, closed, style }),
    circle: () => circles++,
  });
  return { paths, circles };
}

describe("lớp vector dùng chung cho PDF và xem trước", () => {
  const layout = printKitLayout();

  it("tờ phong bì: một đường cắt kín, khe cài nét liền, 4 nếp gấp nét đứt, không dấu cắt thiệp", () => {
    const { paths, circles } = record("envelope");
    const closed = paths.filter((p) => p.closed);
    expect(closed).toHaveLength(1);
    expect(closed[0].points).toEqual(layout.envelope.cut);
    expect(paths.find((p) => p.points.length === layout.envelope.slit.length)?.style).toBe(
      SHEET_LINES.cut,
    );
    expect(paths.filter((p) => p.style.dash.length > 0).map((p) => p.points)).toEqual(
      layout.envelope.fold,
    );
    expect(paths.some((p) => p.style === SHEET_LINES.mark)).toBe(false);
    expect(circles).toBe(layout.envelopeScissors.length * 2);
  });

  it("mặt trước thiệp: chỉ 8 nét dấu cắt và một cái kéo", () => {
    const { paths, circles } = record("cardFront");
    expect(paths.filter((p) => p.style === SHEET_LINES.mark)).toHaveLength(8);
    expect(paths.every((p) => !p.closed && p.style.dash.length === 0)).toBe(true);
    expect(circles).toBe(2);
  });

  it("mặt sau thiệp không có nét nào", () => {
    expect(record("cardBack")).toEqual({ paths: [], circles: 0 });
  });

  it("phong bì và thiệp là hai file riêng; thiệp đủ hai mặt theo thứ tự", () => {
    expect(PRINT_FILES.envelope).toEqual(["envelope"]);
    expect(PRINT_FILES.card).toEqual(["cardFront", "cardBack"]);
  });
});
