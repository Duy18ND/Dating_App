import confetti from "canvas-confetti";
import type { WebCelebrateEffect, WebIntensity } from "@/types/letter";

const MULT: Record<WebIntensity, number> = {
  light: 0.65,
  medium: 1,
  rich: 1.45,
};

/**
 * Chạy hiệu ứng chúc mừng khi bấm Đồng ý (FR-15 đợt 1):
 * confetti (Hoa giấy), fireworks (Pháo hoa), heart_rain (Mưa tim).
 * Luôn bật disableForReducedMotion: true để tôn trọng prefers-reduced-motion.
 */
export function runCelebration(
  kind: WebCelebrateEffect = "confetti",
  intensity: WebIntensity = "medium",
): void {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const k = MULT[intensity];

  if (kind === "fireworks") {
    const origins = [
      { x: 0.25, y: 0.45 },
      { x: 0.75, y: 0.42 },
      { x: 0.5, y: 0.32 },
    ];
    origins.forEach((origin, idx) => {
      window.setTimeout(() => {
        void confetti({
          particleCount: Math.round(70 * k),
          spread: 110,
          startVelocity: 36,
          ticks: 90,
          origin,
          colors: ["#E8C36B", "#F27890", "#FFFFFF", "#8E2424", "#7AC3EE"],
          disableForReducedMotion: true,
        });
      }, idx * 240);
    });
    return;
  }

  if (kind === "heart_rain") {
    const heartShape =
      typeof confetti.shapeFromText === "function"
        ? confetti.shapeFromText({ text: "♥", scalar: 2 })
        : undefined;
    const waves = intensity === "rich" ? 3 : 2;
    for (let w = 0; w < waves; w++) {
      window.setTimeout(() => {
        void confetti({
          particleCount: Math.round(45 * k),
          spread: 120,
          startVelocity: 18,
          gravity: 0.65,
          scalar: heartShape ? 1.8 : 1.1,
          origin: { x: 0.25 + w * 0.25, y: 0.15 },
          colors: ["#E84C68", "#F28A9E", "#8E2424", "#FFD6DE"],
          shapes: heartShape ? [heartShape] : undefined,
          disableForReducedMotion: true,
        });
      }, w * 260);
    }
    return;
  }

  void confetti({
    particleCount: Math.round(140 * k),
    spread: 92,
    origin: { y: 0.7 },
    disableForReducedMotion: true,
  });
}
