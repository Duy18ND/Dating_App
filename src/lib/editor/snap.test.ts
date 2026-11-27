import { describe, expect, it } from "vitest";
import { computeSnap, snapResizePoint, type Box } from "./snap";

const space = { width: 1760, height: 1240, margin: 84 };
const box = (x: number, y: number, width: number, height: number): Box => ({ x, y, width, height });

describe("hút khi kéo", () => {
  it("hút vào giữa thiệp theo cả hai trục và vẽ hai đường giữa", () => {
    // Tâm lệch (880, 620) một chút.
    const result = computeSnap(box(675, 566, 400, 100), [], space, 12);
    expect([result.dx, result.dy]).toEqual([5, 4]);
    expect(result.guides).toContainEqual({ x1: 880, y1: 0, x2: 880, y2: 1240, kind: "align" });
    expect(result.guides).toContainEqual({ x1: 0, y1: 620, x2: 1760, y2: 620, kind: "align" });
  });

  it("hút vào lề an toàn", () => {
    const result = computeSnap(box(90, 300, 200, 100), [], space, 12);
    expect(result.dx).toBe(-6);
  });

  it("ngoài ngưỡng thì để yên, không vẽ đường nào", () => {
    expect(computeSnap(box(300, 300, 200, 100), [], space, 12)).toEqual({
      dx: 0,
      dy: 0,
      guides: [],
    });
  });

  it("thẳng cạnh trái với vật khác", () => {
    const title = box(250, 200, 900, 200);
    const result = computeSnap(box(257, 700, 300, 60), [title], space, 12);
    expect(result.dx).toBe(-7);
    expect(result.guides.some((g) => g.x1 === 250 && g.x2 === 250)).toBe(true);
  });

  it("tự cách đều giữa vật trên và vật dưới", () => {
    const heart = box(780, 100, 200, 150);
    const subtitle = box(780, 800, 200, 80);
    // Chỗ trống 250..800 = 550, vật cao 200: cách đều khi mỗi bên 175, tức y = 425.
    const result = computeSnap(box(785, 431, 190, 200), [heart, subtitle], space, 12);
    expect(431 + result.dy).toBe(425);
    const gaps = result.guides.filter((g) => g.kind === "gap");
    expect(gaps.map((g) => g.y2 - g.y1)).toEqual([175, 175]);
  });
});

describe("hút khi kéo giãn", () => {
  const start = box(200, 300, 400, 200);

  it("nút cạnh chỉ đổi một trục", () => {
    const result = snapResizePoint(
      { x: 878, y: 400 },
      "middle-right",
      start,
      true,
      [],
      space,
      12,
    );
    expect([result.x, result.y]).toEqual([880, 400]);
  });

  it("nút góc giữ tỷ lệ: khớp một trục, trục kia nằm đúng trên đường chéo", () => {
    const result = snapResizePoint(
      { x: 874, y: 636 },
      "bottom-right",
      start,
      true,
      [],
      space,
      12,
    );
    expect(result.x).toBe(880);
    // Rộng 680 thì cao 340 (tỷ lệ 2:1) tính từ góc trên trái.
    expect(result.y).toBe(640);
  });

  it("góc trên trái tính từ góc dưới phải đứng yên", () => {
    const result = snapResizePoint({ x: 88, y: 245 }, "top-left", start, true, [], space, 12);
    expect(result.x).toBe(84);
    expect((600 - result.x) / (500 - result.y)).toBeCloseTo(2);
  });
});
