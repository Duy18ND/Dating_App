import type { CSSProperties } from "react";
import type { BackgroundPreset } from "@/types/letter";

export type PresetPatternKind = "grid" | "dots" | "stripes" | "hearts" | "stars" | "frame";

export interface PresetStyle {
  label: string;
  base: string;
  /** Gợi ý màu phong bì đi cùng khi bấm đồng bộ cả bộ. */
  envelopeColor: string;
  pattern?: {
    kind: PresetPatternKind;
    step: number;
    color: string;
    lineWidth: number;
  };
}

export const PRESET_STYLES: Record<BackgroundPreset, PresetStyle> = {
  kraft: { label: "Kraft nâu", base: "#C8A882", envelopeColor: "#C8A882" },
  cream: { label: "Kem Washi", base: "#F9F6F1", envelopeColor: "#DFC7A9" },
  grid: {
    label: "Vở ô ly",
    base: "#FDFCF8",
    envelopeColor: "#DCE8F5",
    pattern: { kind: "grid", step: 40, color: "rgba(70, 110, 170, 0.22)", lineWidth: 1.5 },
  },
  plaid: {
    label: "Kẻ caro",
    base: "#FBF4EC",
    envelopeColor: "#F2D7D5",
    pattern: { kind: "grid", step: 124, color: "rgba(142, 36, 36, 0.14)", lineWidth: 22 },
  },
  dots: {
    label: "Chấm bi",
    base: "#FFF8F2",
    envelopeColor: "#F5D7DC",
    pattern: { kind: "dots", step: 64, color: "rgba(184, 59, 99, 0.18)", lineWidth: 6 },
  },
  stripes: {
    label: "Sọc pastel",
    base: "#FFFDF9",
    envelopeColor: "#E8D2A6",
    pattern: { kind: "stripes", step: 56, color: "rgba(200, 168, 130, 0.2)", lineWidth: 18 },
  },
  blush: {
    label: "Hồng phấn",
    base: "#FDECEF",
    envelopeColor: "#F2D7D5",
    pattern: { kind: "frame", step: 54, color: "rgba(184, 59, 99, 0.28)", lineWidth: 3 },
  },
  sage: {
    label: "Xanh Sage",
    base: "#E9F0E6",
    envelopeColor: "#C9DAC4",
    pattern: { kind: "frame", step: 54, color: "rgba(70, 104, 72, 0.28)", lineWidth: 3 },
  },
  sky: {
    label: "Xanh mây",
    base: "#EAF2FA",
    envelopeColor: "#CFE0F2",
    pattern: { kind: "dots", step: 72, color: "rgba(56, 102, 162, 0.16)", lineWidth: 7 },
  },
  parchment: {
    label: "Giấy cổ điển",
    base: "#F3E6CE",
    envelopeColor: "#D8BC95",
    pattern: { kind: "frame", step: 48, color: "rgba(122, 86, 50, 0.3)", lineWidth: 3 },
  },
  hearts: {
    label: "Tim nhỏ",
    base: "#FFF4F6",
    envelopeColor: "#F2D7D5",
    pattern: { kind: "hearts", step: 110, color: "rgba(196, 60, 86, 0.16)", lineWidth: 2 },
  },
  midnight: {
    label: "Đêm sao",
    base: "#151F38",
    envelopeColor: "#24304A",
    pattern: { kind: "stars", step: 120, color: "rgba(232, 195, 107, 0.45)", lineWidth: 2 },
  },
};

/** CSS nhẹ để ô chọn nền trong BackgroundPanel hiển thị đúng họa tiết thật. */
export function presetSwatchStyle(preset: BackgroundPreset): CSSProperties {
  const { base, pattern } = PRESET_STYLES[preset];
  if (!pattern) return { backgroundColor: base };
  if (pattern.kind === "grid") {
    const size = pattern.lineWidth > 10 ? 16 : 10;
    const stroke = pattern.lineWidth > 10 ? 3 : 1;
    return {
      backgroundColor: base,
      backgroundImage: `linear-gradient(to right, ${pattern.color} ${stroke}px, transparent ${stroke}px), linear-gradient(to bottom, ${pattern.color} ${stroke}px, transparent ${stroke}px)`,
      backgroundSize: `${size}px ${size}px`,
    };
  }
  if (pattern.kind === "dots" || pattern.kind === "hearts" || pattern.kind === "stars") {
    return {
      backgroundColor: base,
      backgroundImage: `radial-gradient(${pattern.color} 1.8px, transparent 1.8px)`,
      backgroundSize: "10px 10px",
    };
  }
  if (pattern.kind === "stripes") {
    return {
      backgroundColor: base,
      backgroundImage: `repeating-linear-gradient(90deg, ${pattern.color} 0 5px, transparent 5px 12px)`,
    };
  }
  return {
    backgroundColor: base,
    boxShadow: `inset 0 0 0 3px ${base}, inset 0 0 0 4.5px ${pattern.color}`,
  };
}
