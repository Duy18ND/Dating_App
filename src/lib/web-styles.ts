import type { FontName } from "@/lib/font-names";
import { inkOn } from "@/lib/render/ink";
import type {
  TemplateType,
  WebCelebrateEffect,
  WebCounterEffect,
  WebIntensity,
  WebOpenEffect,
  WebParticleEffect,
  WebPhotoEffect,
  WebStyleConfig,
  WebTextReveal,
  WebThemeId,
} from "@/types/letter";

export interface ThemeTokens {
  /** Màu nền trang chính. */
  bg: string;
  /** Lớp nền trang trí CSS (pattern nhẹ hoặc gradient dịu). */
  bgPattern: string;
  /** Kích thước lặp pattern nền CSS. */
  bgSize: string;
  /** Màu nền thẻ/khối nội dung. */
  surface: string;
  /** Màu nền thẻ phụ (badge, trích dẫn, khung lịch). */
  surfaceAlt: string;
  /** Màu chữ chính trên nền trang & thẻ. */
  ink: string;
  /** Màu chữ phụ, chú thích. */
  muted: string;
  /** Màu nhấn mặc định của phong cách. */
  accent: string;
  /** Màu viền mềm. */
  border: string;
  /** Trạng thái tối (dùng để điều chỉnh bóng & overlay). */
  isDark: boolean;
  /** Lớp Tailwind tạo cá tính riêng cho từng thẻ nội dung (viền, bo góc, bóng). */
  cardClass: string;
  /** Lớp Tailwind cho thẻ badge/nhãn nhỏ. */
  badgeClass: string;
  /** Lớp Tailwind cho khung ảnh kỷ niệm. */
  photoFrameClass: string;
}

export interface ThemeDefinition {
  id: WebThemeId;
  label: string;
  tagline: string;
  /** Gợi ý màu phong bì in khi chọn phong cách (chỉ gợi ý, không ghi đè nếu người dùng tự chọn). */
  suggestedEnvelopeColor: string;
  /** Sẵn sàng hiển thị đầy đủ (cả 4 phong cách đợt 1 đã hoàn thiện ở T-46). */
  ready: boolean;
  tokens: ThemeTokens;
  fonts: {
    heading: FontName;
    body: FontName;
    script: FontName;
  };
  defaults: {
    open: WebOpenEffect;
    textReveal: WebTextReveal;
    photo: WebPhotoEffect;
    particle: WebParticleEffect;
    counter: WebCounterEffect;
    celebrate: WebCelebrateEffect;
  };
}

/**
 * Danh mục phong cách trang web (FR-15) theo kiến trúc cắm thêm.
 * Thêm phong cách đợt 2 chỉ cần thêm mục vào đây (và union WebThemeId).
 */
export const WEB_THEME_REGISTRY: Record<WebThemeId, ThemeDefinition> = {
  warm_letter: {
    id: "warm_letter",
    label: "Thư tay ấm áp",
    tagline: "Giấy kem Washi, mực nâu ấm và đỏ dấu sáp cổ điển",
    suggestedEnvelopeColor: "#DFC7A9",
    ready: true,
    tokens: {
      bg: "#F8F3EA",
      bgPattern:
        "radial-gradient(rgba(142, 36, 36, 0.045) 1px, transparent 0), linear-gradient(180deg, #FAF6EE 0%, #F2E8D8 100%)",
      bgSize: "22px 22px, auto",
      surface: "#FFFDF9",
      surfaceAlt: "#F3EADF",
      ink: "#2B2623",
      muted: "#6B6057",
      accent: "#8E2424",
      border: "#E6DACB",
      isDark: false,
      cardClass: "rounded-2xl border shadow-xs",
      badgeClass: "rounded-full border",
      photoFrameClass: "rounded-xl border shadow-xs",
    },
    fonts: {
      heading: "Playfair Display",
      body: "Be Vietnam Pro",
      script: "Charm",
    },
    defaults: {
      open: "wax_seal",
      textReveal: "slide",
      photo: "polaroid",
      particle: "petals",
      counter: "count_up",
      celebrate: "confetti",
    },
  },
  starry_night: {
    id: "starry_night",
    label: "Đêm sao",
    tagline: "Nền xanh đêm sâu thẳm, ánh vàng trăng và bụi sao lấp lánh",
    suggestedEnvelopeColor: "#24304A",
    ready: true,
    tokens: {
      bg: "#0F1629",
      bgPattern:
        "radial-gradient(circle at 18% 12%, rgba(232, 195, 107, 0.16), transparent 36%), radial-gradient(circle at 82% 28%, rgba(126, 162, 232, 0.14), transparent 40%), radial-gradient(rgba(255, 248, 225, 0.16) 1px, transparent 0), linear-gradient(180deg, #0D1324 0%, #16213D 55%, #111930 100%)",
      bgSize: "auto, auto, 44px 44px, auto",
      surface: "#18223A",
      surfaceAlt: "#202D4C",
      ink: "#F6F1E7",
      muted: "#B8C4DC",
      accent: "#E8C36B",
      border: "#32436B",
      isDark: true,
      cardClass: "rounded-2xl border shadow-[0_12px_32px_rgba(4,8,20,0.45)] backdrop-blur-xs",
      badgeClass: "rounded-full border shadow-[0_0_20px_rgba(232,195,107,0.16)]",
      photoFrameClass: "rounded-xl border shadow-[0_10px_28px_rgba(4,8,20,0.5)]",
    },
    fonts: {
      heading: "Cormorant Garamond",
      body: "Be Vietnam Pro",
      script: "Dancing Script",
    },
    defaults: {
      open: "hold_heart",
      textReveal: "lines",
      photo: "flip",
      particle: "stars",
      counter: "count_up",
      celebrate: "fireworks",
    },
  },
  pastel: {
    id: "pastel",
    label: "Pastel ngọt ngào",
    tagline: "Hồng kem mềm mại, ruy băng dịu dàng và góc ảnh bồng bềnh",
    suggestedEnvelopeColor: "#F5D7DC",
    ready: true,
    tokens: {
      bg: "#FFF5F8",
      bgPattern:
        "radial-gradient(circle at 85% 8%, rgba(244, 172, 196, 0.28), transparent 40%), radial-gradient(circle at 12% 38%, rgba(255, 214, 186, 0.25), transparent 42%), linear-gradient(180deg, #FFF7FA 0%, #FDEBF1 100%)",
      bgSize: "auto, auto, auto",
      surface: "#FFFFFF",
      surfaceAlt: "#FCE7EE",
      ink: "#3A242D",
      muted: "#7A5865",
      accent: "#B83B63",
      border: "#F2CDD9",
      isDark: false,
      cardClass: "rounded-3xl border shadow-[0_8px_24px_rgba(184,59,99,0.08)]",
      badgeClass: "rounded-full border shadow-xs",
      photoFrameClass: "rounded-3xl border-2 shadow-[0_8px_20px_rgba(184,59,99,0.1)]",
    },
    fonts: {
      heading: "Dancing Script",
      body: "Be Vietnam Pro",
      script: "Charm",
    },
    defaults: {
      open: "ribbon",
      textReveal: "slide",
      photo: "drop",
      particle: "hearts",
      counter: "flip_calendar",
      celebrate: "heart_rain",
    },
  },
  doodle: {
    id: "doodle",
    label: "Doodle vui nhộn",
    tagline: "Giấy vở kẻ caro, viền mực vui tươi và nét vẽ tinh nghịch",
    suggestedEnvelopeColor: "#E8D2A6",
    ready: true,
    tokens: {
      bg: "#FCF8EC",
      bgPattern:
        "linear-gradient(to right, rgba(43, 38, 35, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(43, 38, 35, 0.06) 1px, transparent 1px)",
      bgSize: "26px 26px",
      surface: "#FFFFFF",
      surfaceAlt: "#F8ECCB",
      ink: "#26211E",
      muted: "#5E544C",
      accent: "#B83D24",
      border: "#2B2623",
      isDark: false,
      cardClass: "rounded-xl border-2 shadow-[4px_4px_0_#2B2623]",
      badgeClass: "rounded-lg border-2 shadow-[2px_2px_0_#2B2623]",
      photoFrameClass: "rounded-xl border-2 shadow-[4px_4px_0_#2B2623]",
    },
    fonts: {
      heading: "Mali",
      body: "Be Vietnam Pro",
      script: "Mali",
    },
    defaults: {
      open: "wax_seal",
      textReveal: "typewriter",
      photo: "drop",
      particle: "hearts",
      counter: "flip_calendar",
      celebrate: "confetti",
    },
  },
};

export const WEB_THEME_LIST: ThemeDefinition[] = Object.values(WEB_THEME_REGISTRY);

/** Phong cách mặc định theo từng loại mẫu (FR-15). */
export const DEFAULT_THEME_BY_TEMPLATE: Record<TemplateType, WebThemeId> = {
  confession: "warm_letter",
  wedding: "warm_letter",
  dinner: "doodle",
  holiday: "pastel",
};

export interface EffectOption<T extends string> {
  id: T;
  label: string;
}

/** Danh mục các lựa chọn hiệu ứng đợt 1 (FR-15). */
export const EFFECT_CATALOG: {
  intensity: EffectOption<WebIntensity>[];
  open: EffectOption<WebOpenEffect>[];
  textReveal: EffectOption<WebTextReveal>[];
  photo: EffectOption<WebPhotoEffect>[];
  particle: EffectOption<WebParticleEffect>[];
  counter: EffectOption<WebCounterEffect>[];
  celebrate: EffectOption<WebCelebrateEffect>[];
} = {
  intensity: [
    { id: "light", label: "Nhẹ" },
    { id: "medium", label: "Vừa" },
    { id: "rich", label: "Rực rỡ" },
  ],
  open: [
    { id: "wax_seal", label: "Bóc dấu sáp" },
    { id: "ribbon", label: "Kéo nơ" },
    { id: "hold_heart", label: "Nhấn giữ tim" },
  ],
  textReveal: [
    { id: "slide", label: "Trượt nhẹ" },
    { id: "typewriter", label: "Gõ từng chữ" },
    { id: "lines", label: "Hiện từng dòng" },
  ],
  photo: [
    { id: "polaroid", label: "Polaroid nghiêng" },
    { id: "flip", label: "Lật xem lời nhắn" },
    { id: "drop", label: "Thả xuống bàn" },
  ],
  particle: [
    { id: "none", label: "Tắt" },
    { id: "hearts", label: "Tim bay" },
    { id: "stars", label: "Sao lấp lánh" },
    { id: "petals", label: "Cánh hoa" },
  ],
  counter: [
    { id: "count_up", label: "Đếm tăng" },
    { id: "flip_calendar", label: "Lịch lật" },
  ],
  celebrate: [
    { id: "confetti", label: "Hoa giấy" },
    { id: "fireworks", label: "Pháo hoa" },
    { id: "heart_rain", label: "Mưa tim" },
  ],
};

function relativeLuminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Tỷ lệ tương phản WCAG giữa hai màu #RRGGBB. */
export function contrastRatio(hexA: string, hexB: string): number {
  const l1 = relativeLuminance(hexA);
  const l2 = relativeLuminance(hexB);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** Màu nhấn tùy chọn phải đủ tương phản trên nền thẻ (tối thiểu 3.0 cho chữ lớn/UI). */
export function isReadableAccent(accentHex: string, surfaceHex: string): boolean {
  return contrastRatio(accentHex, surfaceHex) >= 3;
}

export interface ResolvedWebStyle {
  theme: ThemeDefinition;
  intensity: WebIntensity;
  accent: string;
  accentInk: string;
  headingFont: FontName;
  bodyFont: FontName;
  scriptFont: FontName;
  open: WebOpenEffect;
  textReveal: WebTextReveal;
  photo: WebPhotoEffect;
  particle: WebParticleEffect;
  counter: WebCounterEffect;
  celebrate: WebCelebrateEffect;
}

/**
 * Hợp nhất style người dùng chọn với mặc định của phong cách.
 * Thư cũ chưa có `style` luôn dùng `warm_letter` (đúng FR-15).
 */
export function resolveWebStyle(style?: WebStyleConfig): ResolvedWebStyle {
  const themeId: WebThemeId = style?.theme ?? "warm_letter";
  const theme = WEB_THEME_REGISTRY[themeId] ?? WEB_THEME_REGISTRY.warm_letter;
  const candidateAccent = style?.accent;
  const accent =
    candidateAccent && isReadableAccent(candidateAccent, theme.tokens.surface)
      ? candidateAccent
      : theme.tokens.accent;
  const headingFont = style?.font ?? theme.fonts.heading;
  return {
    theme,
    intensity: style?.intensity ?? "medium",
    accent,
    accentInk: inkOn(accent),
    headingFont,
    bodyFont: theme.fonts.body,
    scriptFont: style?.font ?? theme.fonts.script,
    open: style?.open ?? theme.defaults.open,
    textReveal: style?.textReveal ?? theme.defaults.textReveal,
    photo: style?.photo ?? theme.defaults.photo,
    particle: style?.particle ?? theme.defaults.particle,
    counter: style?.counter ?? theme.defaults.counter,
    celebrate: style?.celebrate ?? theme.defaults.celebrate,
  };
}

/** Tạo cấu hình phong cách mặc định cho một loại mẫu. */
export function defaultWebStyle(templateType?: TemplateType): WebStyleConfig {
  return {
    theme: templateType ? DEFAULT_THEME_BY_TEMPLATE[templateType] : "warm_letter",
    intensity: "medium",
  };
}

const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

/** Gợi ý ngẫu nhiên một tổ hợp phong cách + hiệu ứng hợp nhau (FR-15). */
export function randomWebStyle(
  current?: WebStyleConfig,
  allowedThemes?: WebThemeId[],
): WebStyleConfig {
  const pool =
    allowedThemes && allowedThemes.length > 0 ? allowedThemes : WEB_THEME_LIST.map((t) => t.id);
  const others = pool.filter((id) => id !== current?.theme);
  const theme = pick(others.length > 0 ? others : pool);
  return {
    theme,
    intensity: pick(EFFECT_CATALOG.intensity).id,
    open: pick(EFFECT_CATALOG.open).id,
    textReveal: pick(EFFECT_CATALOG.textReveal).id,
    photo: pick(EFFECT_CATALOG.photo).id,
    particle: pick(EFFECT_CATALOG.particle).id,
    counter: pick(EFFECT_CATALOG.counter).id,
    celebrate: pick(EFFECT_CATALOG.celebrate).id,
  };
}

const FONT_CSS_VAR: Record<FontName, string> = {
  "Be Vietnam Pro": "var(--font-be-vietnam), sans-serif",
  "Cormorant Garamond": "var(--nf-cormorant), serif",
  "Playfair Display": "var(--nf-playfair), serif",
  Charm: "var(--nf-charm), cursive",
  "Dancing Script": "var(--nf-dancing), cursive",
  Mali: "var(--nf-mali), cursive",
};

export const cssFontVar = (name: FontName): string => FONT_CSS_VAR[name];
