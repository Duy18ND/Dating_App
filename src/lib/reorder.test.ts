import { describe, expect, it } from "vitest";
import { dropIndex, moveItem } from "./reorder";

describe("kéo tay đổi thứ tự", () => {
  const items = ["a", "b", "c", "d"];
  // Đường giữa của 4 mục cao 60.
  const middles = [30, 90, 150, 210];

  it("chuyển mục lên hoặc xuống", () => {
    expect(moveItem(items, 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(moveItem(items, 3, 0)).toEqual(["d", "a", "b", "c"]);
    expect(moveItem(items, 1, 1)).toBe(items);
    expect(moveItem(items, 9, 0)).toBe(items);
  });

  it("vị trí thả theo con trỏ so với đường giữa các mục khác", () => {
    expect(dropIndex(middles, 0, 10)).toBe(0);
    expect(dropIndex(middles, 0, 100)).toBe(1);
    expect(dropIndex(middles, 0, 999)).toBe(3);
    expect(dropIndex(middles, 3, 0)).toBe(0);
    // Con trỏ còn ở quanh chỗ cũ thì không đổi.
    expect(dropIndex(middles, 2, 150)).toBe(2);
  });
});
