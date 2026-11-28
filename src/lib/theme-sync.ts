import type { BackgroundConfig, WebThemeId } from "@/types/letter";

export interface KitPalette {
  id: string;
  label: string;
  /** Màu hiển thị chấm đôi trên nút chọn nhanh. */
  swatches: [string, string];
  cardBackground: BackgroundConfig;
  envelopeColor: string;
  waxSealColor: string;
  webTheme: WebThemeId;
  webAccent: string;
}

/** 6 bộ phối màu đồng bộ cả bộ: Mặt trước + Mặt sau + Phong bì + Trang web trong 1 lần bấm. */
export const KIT_PALETTES: readonly KitPalette[] = [
  {
    id: "classic-wine",
    label: "Đỏ rượu · Kem",
    swatches: ["#F9F6F1", "#8E2424"],
    cardBackground: { type: "preset", value: "cream", overlayOpacity: 0 },
    envelopeColor: "#DFC7A9",
    waxSealColor: "#8E2424",
    webTheme: "warm_letter",
    webAccent: "#8E2424",
  },
  {
    id: "blush-love",
    label: "Hồng phấn",
    swatches: ["#FDECEF", "#B83B63"],
    cardBackground: { type: "preset", value: "blush", overlayOpacity: 0 },
    envelopeColor: "#F5D7DC",
    waxSealColor: "#B83B63",
    webTheme: "pastel",
    webAccent: "#B83B63",
  },
  {
    id: "kraft-cafe",
    label: "Kraft · Nâu ấm",
    swatches: ["#C8A882", "#5C3A21"],
    cardBackground: { type: "preset", value: "kraft", overlayOpacity: 0 },
    envelopeColor: "#C8A882",
    waxSealColor: "#8E2424",
    webTheme: "doodle",
    webAccent: "#B83D24",
  },
  {
    id: "sage-garden",
    label: "Xanh Sage",
    swatches: ["#E9F0E6", "#2F5B42"],
    cardBackground: { type: "preset", value: "sage", overlayOpacity: 0 },
    envelopeColor: "#C9DAC4",
    waxSealColor: "#2F5B42",
    webTheme: "warm_letter",
    webAccent: "#2F5B42",
  },
  {
    id: "sky-pastel",
    label: "Xanh mây",
    swatches: ["#EAF2FA", "#244775"],
    cardBackground: { type: "preset", value: "sky", overlayOpacity: 0 },
    envelopeColor: "#CFE0F2",
    waxSealColor: "#244775",
    webTheme: "pastel",
    webAccent: "#244775",
  },
  {
    id: "starry-gold",
    label: "Đêm sao · Vàng",
    swatches: ["#151F38", "#E8C36B"],
    cardBackground: { type: "preset", value: "midnight", overlayOpacity: 0 },
    envelopeColor: "#24304A",
    waxSealColor: "#C79E44",
    webTheme: "starry_night",
    webAccent: "#E8C36B",
  },
];
