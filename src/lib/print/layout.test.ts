import { describe, expect, it } from "vitest";
import { PRINT_CONFIG } from "@/lib/print-config";
import { cardStrips, cropMarks, envelopeC7, letterSheet, type Rect } from "./layout";

const A4 = PRINT_CONFIG.PAPER_A4_MM;
const { BLEED_MM: bleed, CARD_FACE_MM: face } = PRINT_CONFIG;
const inA4 = (r: Rect, margin = 0) =>
  r.x - margin >= 0 &&
  r.y - margin >= 0 &&
  r.x + r.width + margin <= A4.width &&
  r.y + r.height + margin <= A4.height;

describe("bộ in mini", () => {
  it("phôi C7 trải phẳng 144 x 188 mm, căn giữa A4", () => {
    const { cut, body } = envelopeC7();
    const xs = cut.map(([x]) => x);
    const ys = cut.map(([, y]) => y);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(144);
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(188);
    expect(Math.min(...xs) + Math.max(...xs)).toBeCloseTo(A4.width);
    expect(Math.min(...ys) + Math.max(...ys)).toBeCloseTo(A4.height);
    expect(body).toMatchObject({ width: 114, height: 81 });
  });

  it("thiệp đóng và thư đã gấp vừa phong bì, còn khe rút 9 x 7 mm", () => {
    const { body } = envelopeC7();
    expect(body.width - face.width).toBe(9);
    expect(body.height - face.height).toBe(7);
    expect(PRINT_CONFIG.LETTER_MM.panelHeight).toBe(face.height);
    expect(PRINT_CONFIG.LETTER_MM.width).toBe(face.width);
  });

  it("hai dải thiệp đứng cạnh nhau, không chạm, nằm trong A4 kể cả tràn màu và dấu cắt", () => {
    const { outer, inner, slots } = cardStrips();
    for (const strip of [outer, inner]) {
      expect(strip).toMatchObject({ width: 74, height: 210 });
      expect(inA4(strip, bleed + 8)).toBe(true);
    }
    expect(inner.x - (outer.x + outer.width)).toBeGreaterThanOrEqual(2 * bleed + 6);
    // Mỗi ô là một mặt 105 x 74 đã xoay 90°.
    for (const slot of Object.values(slots)) expect(slot).toMatchObject({ width: 74, height: 105 });
    expect(slots.back.x).toBe(slots.front.x);
    expect(slots.back.y + 105).toBe(slots.front.y);
    expect(slots.writing.x).toBe(inner.x);
  });

  it("thư gấp 3 căn giữa A4, vạch gấp chia đều 3 ô", () => {
    const { rect, folds } = letterSheet();
    expect(rect.x * 2 + rect.width).toBeCloseTo(A4.width);
    expect(rect.y * 2 + rect.height).toBeCloseTo(A4.height);
    expect(folds).toEqual([rect.y + 74, rect.y + 148]);
    expect(inA4(rect, bleed + 8)).toBe(true);
  });

  it("dấu cắt nằm ngoài vùng tràn màu", () => {
    const { outer } = cardStrips();
    for (const segment of cropMarks(outer)) {
      for (const [x, y] of segment) {
        const inBleed =
          x > outer.x - bleed &&
          x < outer.x + outer.width + bleed &&
          y > outer.y - bleed &&
          y < outer.y + outer.height + bleed;
        expect(inBleed).toBe(false);
      }
    }
  });
});
