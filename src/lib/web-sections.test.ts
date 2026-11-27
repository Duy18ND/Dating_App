import { describe, expect, it } from "vitest";
import { samplePayload } from "@/lib/test-fixtures";
import { defaultWebSections } from "@/lib/web-defaults";
import { webConfigSchema } from "@/lib/validation";
import { WEB_SECTION_TYPES } from "@/types/letter";
import { insertSection, isSectionEmpty, missingSectionTypes, newSection } from "./web-sections";

describe("phần trang web trong trình soạn", () => {
  it("phần mới của mọi loại đều hợp lệ với API", () => {
    const sections = WEB_SECTION_TYPES.map(newSection);
    const result = webConfigSchema.safeParse({ ...samplePayload().web_config, sections });
    expect(result.success).toBe(true);
    expect(new Set(sections.map((s) => s.id)).size).toBe(sections.length);
  });

  it("phần mới chưa nhập gì thì bị coi là trống; tương tác phụ thuộc khối đang bật", () => {
    for (const type of WEB_SECTION_TYPES) {
      expect(isSectionEmpty(newSection(type), false)).toBe(true);
    }
    expect(isSectionEmpty(newSection("interact"), true)).toBe(false);
  });

  it("chỉ gợi ý thêm loại chưa có", () => {
    const sections = defaultWebSections("holiday");
    const missing = missingSectionTypes(sections);
    for (const section of sections) expect(missing).not.toContain(section.type);
    expect(sections.length + missing.length).toBe(WEB_SECTION_TYPES.length);
  });

  it("chèn phần mới trước Lời kết", () => {
    const sections = defaultWebSections("holiday");
    const next = insertSection(sections, newSection("counter"));
    expect(next.at(-1)?.type).toBe("ending");
    expect(next.at(-2)?.type).toBe("counter");
    expect(insertSection([], newSection("hero"))).toHaveLength(1);
  });
});
