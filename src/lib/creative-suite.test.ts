import { describe, expect, it } from "vitest";
import { resolveAudioUrl } from "@/lib/audio-tracks";
import { hexToHsv, hsvToHex, normalizeHex } from "@/lib/color";
import { useEditorStore } from "@/lib/editor/store";
import { PRESET_STYLES, presetSwatchStyle } from "@/lib/render/presets";
import { samplePayload } from "@/lib/test-fixtures";
import { KIT_PALETTES } from "@/lib/theme-sync";
import {
  collectUserImageUrls,
  collectWebImageUrls,
  letterPayloadSchema,
  webConfigSchema,
  webSectionSchema,
  webStyleSchema,
} from "@/lib/validation";
import { isSectionEmpty, newSection } from "@/lib/web-sections";
import {
  BACKGROUND_PRESETS,
  IMAGE_FRAMES,
  PHOTOBOOTH_ANIMATIONS,
  PHOTOBOOTH_LAYOUTS,
  WEB_GARLANDS,
} from "@/types/letter";

describe("color HEX helpers", () => {
  it("chuẩn hóa mã #RGB và #RRGGBB, từ chối chuỗi sai", () => {
    expect(normalizeHex("#fff")).toBe("#FFFFFF");
    expect(normalizeHex("8e2424")).toBe("#8E2424");
    expect(normalizeHex("  #AbC ")).toBe("#AABBCC");
    expect(normalizeHex("rgb(1,2,3)")).toBeNull();
    expect(normalizeHex("#12")).toBeNull();
  });

  it("chuyển đổi qua lại HEX <-> HSV ổn định", () => {
    for (const hex of ["#8E2424", "#FFFFFF", "#000000", "#E8C36B", "#2F5B42"]) {
      const hsv = hexToHsv(hex);
      expect(hsvToHex(hsv.h, hsv.s, hsv.v)).toBe(hex);
    }
  });
});

describe("12 khung ảnh & 12 mẫu nền giấy", () => {
  it("mọi mẫu nền giấy đều có cấu hình và CSS preview", () => {
    expect(BACKGROUND_PRESETS.length).toBe(12);
    for (const preset of BACKGROUND_PRESETS) {
      expect(PRESET_STYLES[preset].label).toBeTruthy();
      expect(PRESET_STYLES[preset].envelopeColor).toMatch(/^#[0-9A-F]{6}$/i);
      expect(presetSwatchStyle(preset).backgroundColor).toBe(PRESET_STYLES[preset].base);
    }
  });

  it("mọi khung ảnh 12 kiểu và màu viền đều qua kiểm tra Zod", () => {
    expect(IMAGE_FRAMES.length).toBe(12);
    const payload = samplePayload();
    for (const frame of IMAGE_FRAMES) {
      const clone = structuredClone(payload);
      clone.canvas_data.faces.front.elements.push({
        id: `img-${frame}`,
        type: "image",
        x: 100,
        y: 100,
        width: 400,
        height: 400,
        rotation: 0,
        zIndex: 99,
        src: "https://cdn.test/uploads/demo.webp",
        frame,
        borderWidth: 16,
        borderColor: "#F9F6F1",
      });
      expect(letterPayloadSchema.safeParse(clone).success).toBe(true);
    }
  });
});

describe("Đồng bộ màu Phong bì & Thiệp 1 chạm", () => {
  it("applyKitPalette đồng bộ cả Mặt trước, Mặt sau, Phong bì, Web và hỗ trợ Undo", () => {
    const store = useEditorStore.getState();
    store.load(samplePayload());
    const beforeEnv = useEditorStore.getState().doc.web_config.envelopeColor;
    const palette = KIT_PALETTES[KIT_PALETTES.length - 1];
    store.applyKitPalette(palette);

    const after = useEditorStore.getState().doc;
    expect(after.canvas_data.faces.front.background).toEqual(palette.cardBackground);
    expect(after.canvas_data.faces.inside.background).toEqual(palette.cardBackground);
    expect(after.web_config.envelopeColor).toBe(palette.envelopeColor);
    expect(after.web_config.waxSealColor).toBe(palette.waxSealColor);
    expect(after.web_config.style?.theme).toBe(palette.webTheme);

    store.undo();
    expect(useEditorStore.getState().doc.web_config.envelopeColor).toBe(beforeEnv);
  });

  it("syncCardAndEnvelopeTheme đồng bộ nền thiệp hiện tại cho 2 mặt và màu phong bì", () => {
    const store = useEditorStore.getState();
    store.load(samplePayload());
    store.setBackground({ type: "preset", value: "sage" });
    store.syncCardAndEnvelopeTheme();

    const doc = useEditorStore.getState().doc;
    expect(doc.canvas_data.faces.front.background.value).toBe("sage");
    expect(doc.canvas_data.faces.inside.background.value).toBe("sage");
    expect(doc.web_config.envelopeColor).toBe(PRESET_STYLES.sage.envelopeColor);
  });
});

describe("Nhạc tải lên riêng, Photobooth & Thẻ cào", () => {
  it("hỗ trợ file nhạc tải lên riêng (customUrl) và gắn vào danh sách upload", () => {
    const payload = samplePayload();
    const customUrl = "https://cdn.test/uploads/audio/my-song.mp3";
    payload.web_config.audio = {
      enabled: true,
      trackId: "romantic-1",
      startTime: 35,
      volume: 0.7,
      customUrl,
      customName: "bai-hat-cua-chung-minh.mp3",
    };
    expect(webConfigSchema.safeParse(payload.web_config).success).toBe(true);
    expect(resolveAudioUrl(payload.web_config.audio)).toBe(customUrl);
    expect(collectUserImageUrls(payload.canvas_data, payload.web_config)).toContain(customUrl);
    expect(collectWebImageUrls(payload.web_config)).not.toContain(customUrl);
  });

  it("photobooth hỗ trợ tới 8 ảnh, đủ 4 kiểu khung và 5 hiệu ứng animation", () => {
    const section = newSection("photobooth");
    expect(isSectionEmpty(section, false)).toBe(true);
    if (section.type === "photobooth") {
      section.photos = Array.from({ length: 8 }, (_, i) => ({
        src: `https://cdn.test/uploads/p${i + 1}.webp`,
        frame: i % 2 === 0 ? "heart" : "circle",
      }));
      for (const layout of PHOTOBOOTH_LAYOUTS) {
        for (const animation of PHOTOBOOTH_ANIMATIONS) {
          expect(webSectionSchema.safeParse({ ...section, layout, animation }).success).toBe(true);
        }
      }
      expect(isSectionEmpty(section, false)).toBe(false);
      expect(collectWebImageUrls({ sections: [section] })).toHaveLength(8);
    }
  });

  it("scratch và garland hợp chuẩn Zod", () => {
    const scratch = newSection("scratch");
    expect(webSectionSchema.safeParse(scratch).success).toBe(true);
    expect(isSectionEmpty(scratch, false)).toBe(true);
    if (scratch.type === "scratch") {
      scratch.secret = "Thật ra mình đã thích cậu từ lâu!";
      expect(isSectionEmpty(scratch, false)).toBe(false);
    }
    for (const garland of WEB_GARLANDS) {
      expect(
        webStyleSchema.safeParse({ theme: "warm_letter", intensity: "medium", garland }).success,
      ).toBe(true);
    }
  });
});
