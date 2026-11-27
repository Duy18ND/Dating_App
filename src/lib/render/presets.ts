import type { BackgroundPreset } from "@/types/letter";

export const PRESET_STYLES: Record<
  BackgroundPreset,
  { label: string; base: string; pattern?: { step: number; color: string; lineWidth: number } }
> = {
  kraft: { label: "Kraft nâu", base: "#C8A882" },
  cream: { label: "Kem Washi", base: "#F9F6F1" },
  grid: {
    label: "Vở ô ly",
    base: "#FDFCF8",
    pattern: { step: 40, color: "rgba(70, 110, 170, 0.22)", lineWidth: 1.5 },
  },
  plaid: {
    label: "Kẻ caro",
    base: "#FBF4EC",
    pattern: { step: 124, color: "rgba(142, 36, 36, 0.14)", lineWidth: 22 },
  },
};
