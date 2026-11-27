import { describe, expect, it } from "vitest";
import { PRINT_CONFIG } from "@/lib/print-config";
import {
  bounds,
  cropMarks,
  envelopeC7,
  foldedEnvelope,
  insidePolygon,
  letterSheet,
  miniCard,
  printKitLayout,
  type Point,
  type Rect,
} from "./layout";

const A4 = PRINT_CONFIG.PAPER_A4_MM;
const { BLEED_MM: bleed, CARD_FACE_MM: face, ENVELOPE_C7_FLAT_MM: env } = PRINT_CONFIG;
const grow = (r: Rect, by: number): Rect => ({
  x: r.x - by,
  y: r.y - by,
  width: r.width + by * 2,
  height: r.height + by * 2,
});
const inA4 = (r: Rect) =>
  r.x >= 0 && r.y >= 0 && r.x + r.width <= A4.width && r.y + r.height <= A4.height;
const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
const segmentsBox = (segments: [Point, Point][]) => bounds(segments.flat());

describe("bộ in 1 trang A4 (v1.7)", () => {
  it("phôi C7 liền mạch 144 x 188 mm ở x = 33, y = 10..198", () => {
    const outline = bounds(envelopeC7().cut);
    expect(outline.x).toBeCloseTo(33);
    expect(outline.y).toBeCloseTo(10);
    expect(outline.width).toBeCloseTo(144);
    expect(outline.height).toBeCloseTo(188);
    expect(inA4(grow(outline, bleed))).toBe(true);
  });

  it("thân 114 x 81, nắp trên 45 mm gồm vòm và tai cài 22 x 10 ở chính giữa đỉnh", () => {
    const { body, tab, cut, topFlap } = envelopeC7();
    expect(body).toMatchObject({ x: 48, y: 55, width: 114, height: 81 });
    expect(topFlap.height).toBe(45);
    expect(tab).toMatchObject({ width: 22, height: 10, y: 10 });
    expect(tab.x * 2 + tab.width).toBeCloseTo(A4.width);
    // Phần cao hơn chân tai cài chỉ có tai cài.
    const aboveDome = cut.filter(([, y]) => y < tab.y + tab.height - 1e-6);
    for (const [x] of aboveDome) {
      expect(x).toBeGreaterThanOrEqual(tab.x - 1e-6);
      expect(x).toBeLessThanOrEqual(tab.x + tab.width + 1e-6);
    }
    // Vòm nằm gọn trong bề rộng thân, không lấn sang tai bên.
    for (const [x, y] of cut.filter(([, y]) => y < body.y)) {
      expect(x).toBeGreaterThanOrEqual(body.x - 1e-6);
      expect(x).toBeLessThanOrEqual(body.x + body.width + 1e-6);
      expect(y).toBeGreaterThanOrEqual(10 - 1e-6);
    }
  });

  it("khe cài 26 mm cách nếp gấp đáy 45 mm, khớp tai cài khi gấp", () => {
    const e = envelopeC7();
    const slit = bounds(e.slit);
    expect(slit.width).toBeCloseTo(26);
    expect(slit.height).toBeLessThanOrEqual(2);
    expect(slit.x * 2 + slit.width).toBeCloseTo(A4.width);
    expect(e.slitY - (e.body.y + e.body.height)).toBe(45);
    expect(198 - e.slitY).toBe(17);
    // Khi gấp: khe nằm giữa chân tai (35 mm) và mũi tai (45 mm) tính từ mép trên thân.
    expect(e.foldedSlitFromTop).toBeGreaterThan(env.topFlap - env.tuckTab.height);
    expect(e.foldedSlitFromTop).toBeLessThan(env.topFlap);
    expect(env.tuckSlit.width).toBeGreaterThan(env.tuckTab.width);
    // Khe nằm trọn trong nắp đáy, cách mép cắt.
    for (const point of e.slit) expect(insidePolygon(point, e.cut)).toBe(true);
  });

  it("vùng keo nằm trên tai bên và bị nắp đáy che hoàn toàn khi gấp", () => {
    const e = envelopeC7();
    const bottomFold = e.body.y + e.body.height;
    e.glue.forEach((zone, side) => {
      const foldX = side === 0 ? e.body.x : e.body.x + e.body.width;
      for (const point of zone) {
        const [x, y] = point;
        // Nằm trên tai bên (ngoài thân) và trong mép cắt.
        expect(insidePolygon(point, e.cut)).toBe(true);
        expect(side === 0 ? x < foldX : x > foldX).toBe(true);
        // Khi gấp: cao h trên nếp đáy, cách nếp bên s; nắp đáy phủ được tới đó.
        const h = bottomFold - y;
        const s = Math.abs(x - foldX);
        expect(h).toBeGreaterThanOrEqual(env.glueInset - 1e-9);
        expect(h).toBeLessThanOrEqual(env.bottomFlap - env.glueInset + 1e-9);
        expect(s).toBeGreaterThanOrEqual(e.bottomFlapInsetAt(h) + 1);
      }
    });
  });

  it("thiệp mini 105 x 74 phẳng ở y = 211..285, căn giữa, vừa phong bì", () => {
    const card = miniCard();
    expect(card).toEqual({ x: 52.5, y: 211, width: face.width, height: face.height });
    const { body } = envelopeC7();
    expect(body.width - card.width).toBe(9);
    expect(body.height - card.height).toBe(7);
  });

  it("phong bì và thiệp không chạm nhau kể cả tràn màu 2 mm và dấu cắt", () => {
    const { envelope, card, cardCropMarks } = printKitLayout();
    const envelopeArea = grow(bounds(envelope.cut), bleed);
    const cardArea = grow(card, bleed);
    expect(overlaps(envelopeArea, cardArea)).toBe(false);
    const marks = segmentsBox(cardCropMarks);
    expect(inA4(marks)).toBe(true);
    expect(marks.y).toBeGreaterThan(envelopeArea.y + envelopeArea.height);
  });

  it("dấu cắt nằm ngoài vùng tràn màu của thiệp", () => {
    const card = miniCard();
    for (const segment of cropMarks(card)) {
      for (const point of segment) {
        const [x, y] = point;
        const inBleed =
          x > card.x - bleed &&
          x < card.x + card.width + bleed &&
          y > card.y - bleed &&
          y < card.y + card.height + bleed;
        expect(inBleed).toBe(false);
      }
    }
  });

  it("biểu tượng kéo nằm ngoài vùng in (trừ cái cạnh khe cài) và không đè dấu cắt", () => {
    const { envelope, card, cardCropMarks, scissors } = printKitLayout();
    const [outside, cardSide, slitSide] = scissors;
    const envelopeArea = grow(bounds(envelope.cut), bleed);
    expect(overlaps(outside.box, envelopeArea)).toBe(false);
    expect(overlaps(cardSide.box, grow(card, bleed))).toBe(false);
    for (const icon of [outside, cardSide]) {
      expect(inA4(icon.box)).toBe(true);
      for (const [[x1, y1], [x2, y2]] of cardCropMarks) {
        const mark = bounds([
          [x1, y1],
          [x2, y2],
        ]);
        expect(overlaps(icon.box, grow(mark, 0.5))).toBe(false);
      }
    }
    // Kéo nhỏ cạnh khe: nằm trên nắp đáy, không đè lên khe.
    const corners: Point[] = [
      [slitSide.box.x, slitSide.box.y],
      [slitSide.box.x + slitSide.box.width, slitSide.box.y + slitSide.box.height],
    ];
    for (const point of corners) expect(insidePolygon(point, envelope.cut)).toBe(true);
    expect(overlaps(slitSide.box, bounds(envelope.slit))).toBe(false);
  });

  it("phong bì gấp xong: mọi nắp nằm trong thân 114 x 81, tai cài qua khe vừa đủ", () => {
    const folded = foldedEnvelope();
    const parts = [...folded.sides, folded.bottomFlap, folded.topFlap, folded.slit];
    for (const [x, y] of parts.flat()) {
      expect(x).toBeGreaterThanOrEqual(-1e-6);
      expect(x).toBeLessThanOrEqual(folded.width + 1e-6);
      expect(y).toBeGreaterThanOrEqual(-1e-6);
      expect(y).toBeLessThanOrEqual(folded.height + 1e-6);
    }
    // Nắp trên gấp xuống cao 45 mm, quá khe (36 mm) một đoạn để cài.
    expect(bounds(folded.topFlap).height).toBeCloseTo(45);
    expect(folded.slitY).toBe(36);
    expect(folded.slit[folded.slit.length >> 1][1]).toBeCloseTo(36);
    // Nắp đáy phủ lên trên hai tai bên và che chỗ hở dưới nắp trên.
    expect(bounds(folded.bottomFlap).y).toBeLessThan(folded.flapHeight);
  });

  it("thư gấp 3 (chưa in mặc định) vẫn chia đều 3 ô", () => {
    const { rect, folds } = letterSheet();
    expect(folds).toEqual([rect.y + 74, rect.y + 148]);
  });
});
