import { describe, expect, it } from "vitest";
import { isBridgeMessage } from "./preview-bridge";

describe("tin nhắn giữa trình soạn và khung xem trước", () => {
  const frame = {};
  const expected = { origin: "https://a.test", source: frame, tag: "pls-editor" as const };
  const good = { origin: "https://a.test", source: frame, data: { source: "pls-editor" } };

  it("nhận tin đúng origin, đúng cửa sổ, đúng nhãn", () => {
    expect(isBridgeMessage(good, expected)).toBe(true);
  });

  it("từ chối origin lạ, cửa sổ khác, nhãn khác và khi không có cửa sổ cha", () => {
    expect(isBridgeMessage({ ...good, origin: "https://evil.test" }, expected)).toBe(false);
    expect(isBridgeMessage({ ...good, source: {} }, expected)).toBe(false);
    expect(isBridgeMessage({ ...good, data: null }, expected)).toBe(false);
    expect(isBridgeMessage({ ...good, source: null }, { ...expected, source: null })).toBe(false);
  });
});
