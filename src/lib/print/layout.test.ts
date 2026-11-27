import { describe, expect, it } from "vitest";
import { PRINT_CONFIG } from "@/lib/print-config";
import { cardRect, cropMarks, envelopeC6 } from "./layout";

const A4 = PRINT_CONFIG.PAPER_A4_MM;

describe("bản in", () => {
  it("phôi C6 trải phẳng đúng 192 x 274 mm và nằm trọn trong A4", () => {
    const { cut, body } = envelopeC6();
    const xs = cut.map(([x]) => x);
    const ys = cut.map(([, y]) => y);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(192);
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(274);
    expect(Math.min(...xs)).toBeCloseTo(9);
    expect(Math.min(...ys)).toBeCloseTo(11.5);
    expect(Math.max(...xs)).toBeLessThanOrEqual(A4.width);
    expect(Math.max(...ys)).toBeLessThanOrEqual(A4.height);
    expect(body).toMatchObject({ width: 162, height: 114 });
  });

  it("thiệp A6 nằm ngang vừa thân phong bì, chừa khe rút 14 x 9 mm", () => {
    const card = cardRect("A6");
    const { body } = envelopeC6();
    expect(body.width - card.height).toBe(14);
    expect(body.height - card.width).toBe(9);
  });

  it.each(["A6", "A5"] as const)("thiệp %s căn giữa A4", (size) => {
    const card = cardRect(size);
    expect(card.x * 2 + card.width).toBeCloseTo(A4.width);
    expect(card.y * 2 + card.height).toBeCloseTo(A4.height);
  });

  it("dấu cắt nằm ngoài mép thiệp và trong trang", () => {
    const card = cardRect("A5");
    for (const [[x1, y1], [x2, y2]] of cropMarks(card)) {
      for (const [x, y] of [
        [x1, y1],
        [x2, y2],
      ]) {
        const inside =
          x > card.x && x < card.x + card.width && y > card.y && y < card.y + card.height;
        expect(inside).toBe(false);
        expect(x).toBeGreaterThanOrEqual(0);
        expect(y).toBeGreaterThanOrEqual(0);
      }
    }
    expect(cropMarks(card)).toHaveLength(8);
  });
});
