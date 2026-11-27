import { describe, expect, it } from "vitest";
import { useEditorStore } from "@/lib/editor/store";
import { buildPreviewLetter, resolvePreviewTemplate } from "@/lib/preview-samples";
import { coverCrop } from "@/lib/render/image-frame";
import { createFromTemplate } from "@/lib/templates";
import { samplePayload } from "@/lib/test-fixtures";
import {
  collectUserImageUrls,
  collectWebImageUrls,
  letterPayloadSchema,
} from "@/lib/validation";
import { defaultWebSections } from "@/lib/web-defaults";
import {
  contrastRatio,
  defaultWebStyle,
  EFFECT_CATALOG,
  isReadableAccent,
  randomWebStyle,
  resolveWebStyle,
  WEB_THEME_LIST,
} from "@/lib/web-styles";
import { TEMPLATE_TYPES } from "@/types/letter";

const ok = (value: unknown) => letterPayloadSchema.safeParse(value).success;

describe("T-45: Hợp đồng dữ liệu trang web (sections, style, fit/focus)", () => {
  it("thư cũ không có sections, style, focus vẫn hợp lệ", () => {
    const p = samplePayload();
    expect(p.web_config.sections).toBeUndefined();
    expect(p.web_config.style).toBeUndefined();
    expect(ok(p)).toBe(true);
    expect(resolveWebStyle(p.web_config.style).theme.id).toBe("warm_letter");
  });

  it("kiểm tra giới hạn FR-10 và tối đa 8 ảnh web", () => {
    const p = samplePayload();
    p.web_config.sections = [
      {
        id: "h1",
        type: "hero",
        enabled: true,
        lead: "Câu dẫn ngắn",
        image: { src: "https://cdn.test/web-1.webp", fit: "cover", focus: { x: 0.25, y: 0.75 } },
      },
      {
        id: "f1",
        type: "first_day",
        enabled: true,
        text: "Ngày đầu gặp nhau",
        image: { src: "https://cdn.test/web-2.webp", fit: "contain" },
      },
      {
        id: "m1",
        type: "memories",
        enabled: true,
        items: Array.from({ length: 6 }, (_, i) => ({
          id: `mem-${i}`,
          caption: `Kỷ niệm ${i + 1}`,
          image: { src: `https://cdn.test/web-mem-${i}.webp` },
        })),
      },
    ];
    expect(ok(p)).toBe(true);
    expect(collectWebImageUrls(p.web_config)).toHaveLength(8);
    expect(collectUserImageUrls(p.canvas_data, p.web_config)).toHaveLength(8);

    // Thêm ảnh thứ 9 trên web -> từ chối
    const over = structuredClone(p);
    const mem = over.web_config.sections![2];
    if (mem.type === "memories") {
      mem.items.push({
        id: "mem-extra",
        caption: "Quá giới hạn ảnh",
        image: { src: "https://cdn.test/web-mem-extra.webp" },
      });
    }
    expect(ok(over)).toBe(false);
  });

  it("thu thập URL ảnh gồm cả ảnh thiệp và ảnh web, bỏ trùng", () => {
    const p = samplePayload();
    p.canvas_data.faces.front.elements.push({
      id: "card-img",
      type: "image",
      src: "https://cdn.test/shared.webp",
      x: 100,
      y: 100,
      width: 200,
      height: 200,
      rotation: 0,
      zIndex: 5,
      focus: { x: 0.5, y: 0.2 },
      borderWidth: 18,
    });
    p.web_config.sections = [
      {
        id: "hero",
        type: "hero",
        enabled: true,
        lead: "Chào",
        image: { src: "https://cdn.test/shared.webp" },
      },
      {
        id: "first",
        type: "first_day",
        enabled: true,
        text: "Hôm đó",
        image: { src: "https://cdn.test/only-web.webp" },
      },
    ];
    expect(ok(p)).toBe(true);
    expect(collectUserImageUrls(p.canvas_data)).toEqual(["https://cdn.test/shared.webp"]);
    expect(collectUserImageUrls(p.canvas_data, p.web_config).sort()).toEqual([
      "https://cdn.test/only-web.webp",
      "https://cdn.test/shared.webp",
    ]);
  });

  it("chặn giá trị style/focus/section nằm ngoài danh sách cho phép", () => {
    const badTheme = samplePayload();
    // @ts-expect-error kiểm tra dữ liệu lạ từ client
    badTheme.web_config.style = { theme: "neon_hacker", intensity: "medium" };
    expect(ok(badTheme)).toBe(false);

    const badFocus = samplePayload();
    badFocus.canvas_data.faces.front.elements.push({
      id: "img-bad-focus",
      type: "image",
      src: "https://cdn.test/a.webp",
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 0,
      zIndex: 9,
      focus: { x: 1.5, y: 0.5 },
    });
    expect(ok(badFocus)).toBe(false);

    const dupIds = samplePayload();
    dupIds.web_config.sections = [
      { id: "dup", type: "interact", enabled: true },
      { id: "dup", type: "ending", enabled: true, text: "Hết" },
    ];
    expect(ok(dupIds)).toBe(false);
  });

  it("danh mục phong cách đều đạt độ tương phản chữ >= 4.5 và hỗ trợ randomWebStyle", () => {
    for (const theme of WEB_THEME_LIST) {
      expect(contrastRatio(theme.tokens.ink, theme.tokens.surface), theme.id).toBeGreaterThanOrEqual(4.5);
      expect(isReadableAccent(theme.tokens.accent, theme.tokens.surface), theme.id).toBe(true);
    }
    const rnd = randomWebStyle(defaultWebStyle("confession"));
    const p = samplePayload();
    p.web_config.style = rnd;
    expect(ok(p)).toBe(true);
  });

  it("store hỗ trợ setWebStyle và sections qua Undo/Redo", () => {
    const store = useEditorStore.getState();
    store.load(samplePayload());
    store.setWebStyle({ theme: "starry_night", particle: "stars" });
    expect(useEditorStore.getState().doc.web_config.style?.theme).toBe("starry_night");

    store.setWebSections([
      { id: "s1", type: "hero", enabled: true, lead: "A" },
      { id: "s2", type: "ending", enabled: true, text: "B" },
    ]);
    store.moveWebSection("s2", "up");
    expect(useEditorStore.getState().doc.web_config.sections?.map((s) => s.id)).toEqual(["s2", "s1"]);
    store.toggleWebSection("s1", false);
    expect(useEditorStore.getState().doc.web_config.sections?.find((s) => s.id === "s1")?.enabled).toBe(false);

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().doc.web_config.sections?.find((s) => s.id === "s1")?.enabled).toBe(true);
  });
});

describe("T-44 & T-33: Điểm giữ ảnh coverCrop và mẫu xem thử /xem-thu/[mau]", () => {
  it("coverCrop dịch chuyển khung cắt theo focus x, y", () => {
    expect(coverCrop(200, 100, 50, 50, { x: 0, y: 0.5 })).toEqual({ x: 0, y: 0, width: 100, height: 100 });
    expect(coverCrop(200, 100, 50, 50, { x: 1, y: 0.5 })).toEqual({ x: 100, y: 0, width: 100, height: 100 });
    expect(coverCrop(100, 200, 50, 50, { x: 0.5, y: 0.25 })).toEqual({ x: 0, y: 25, width: 100, height: 100 });
  });

  it("tất cả 4 mẫu xem thử đều hợp lệ qua letterPayloadSchema", () => {
    for (const type of TEMPLATE_TYPES) {
      expect(resolvePreviewTemplate(type)).toBe(type);
      const preview = buildPreviewLetter(type);
      const { template_type, title, canvas_data, web_config } = preview;
      expect(letterPayloadSchema.safeParse({ template_type, title, canvas_data, web_config }).error?.issues).toBeUndefined();
    }
    expect(resolvePreviewTemplate("to-tinh")).toBe("confession");
    expect(resolvePreviewTemplate("khong-ton-tai")).toBeNull();
  });

  it("T-35: nội dung Gemini cho 4 mẫu đúng thứ tự FR-01 và gắn vào createFromTemplate", () => {
    const expected = {
      confession: ["hero", "first_day", "memories", "reasons", "counter", "message", "interact", "ending"],
      wedding: ["hero", "counter", "memories", "interact", "ending"],
      dinner: ["hero", "counter", "interact", "ending"],
      holiday: ["hero", "message", "memories", "ending"],
    } as const;
    for (const type of TEMPLATE_TYPES) {
      const sections = defaultWebSections(type);
      expect(sections.map((s) => s.type), type).toEqual([...expected[type]]);
      const payload = createFromTemplate(type);
      expect(payload.web_config.sections?.map((s) => s.type)).toEqual([...expected[type]]);
      expect(letterPayloadSchema.safeParse(payload).error?.issues).toBeUndefined();
    }
  });

  it("T-46 & T-47: đủ 4 phong cách ready, đủ hiệu ứng đợt 1 và độ tương phản đạt chuẩn", () => {
    expect(WEB_THEME_LIST).toHaveLength(4);
    for (const theme of WEB_THEME_LIST) {
      expect(theme.ready, theme.id).toBe(true);
      expect(contrastRatio(theme.tokens.ink, theme.tokens.surface), theme.id).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(theme.tokens.muted, theme.tokens.surface), `${theme.id}:muted`).toBeGreaterThanOrEqual(4.5);
    }
    expect(EFFECT_CATALOG.open.map((o) => o.id)).toEqual(["wax_seal", "ribbon", "hold_heart"]);
    expect(EFFECT_CATALOG.textReveal.map((o) => o.id)).toEqual(["slide", "typewriter", "lines"]);
    expect(EFFECT_CATALOG.photo.map((o) => o.id)).toEqual(["polaroid", "flip", "drop"]);
    expect(EFFECT_CATALOG.particle.map((o) => o.id)).toEqual(["none", "hearts", "stars", "petals"]);
    expect(EFFECT_CATALOG.counter.map((o) => o.id)).toEqual(["count_up", "flip_calendar"]);
    expect(EFFECT_CATALOG.celebrate.map((o) => o.id)).toEqual(["confetti", "fireworks", "heart_rain"]);
  });
});
