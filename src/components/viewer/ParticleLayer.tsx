"use client";

import { useEffect, useRef } from "react";
import type { WebIntensity, WebParticleEffect } from "@/types/letter";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vrot: number;
  alpha: number;
  phase: number;
}

const COUNT_BY_INTENSITY: Record<WebIntensity, { mobile: number; desktop: number }> = {
  light: { mobile: 8, desktop: 14 },
  medium: { mobile: 14, desktop: 24 },
  rich: { mobile: 22, desktop: 38 },
};

const SPEED_BY_INTENSITY: Record<WebIntensity, number> = {
  light: 0.7,
  medium: 1,
  rich: 1.35,
};

function drawHeart(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath();
  ctx.moveTo(0, r * 0.45);
  ctx.bezierCurveTo(-r, -r * 0.25, -r * 0.9, -r, 0, -r * 0.35);
  ctx.bezierCurveTo(r * 0.9, -r, r, -r * 0.25, 0, r * 0.45);
  ctx.fill();
}

function drawPetal(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.85, r * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawStar(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.quadraticCurveTo(r * 0.15, -r * 0.15, r, 0);
  ctx.quadraticCurveTo(r * 0.15, r * 0.15, 0, r);
  ctx.quadraticCurveTo(-r * 0.15, r * 0.15, -r, 0);
  ctx.quadraticCurveTo(-r * 0.15, -r * 0.15, 0, -r);
  ctx.fill();
}

/**
 * Lớp hiệu ứng hạt nền (FR-15):
 * - Mỗi lúc tối đa 1 lớp, pointer-events-none nên không cản đọc hay bấm nút.
 * - Ít hạt hơn trên điện thoại (< 768px).
 * - Tạm dừng hoàn toàn khi tab ẩn (visibilitychange) và tắt khi prefers-reduced-motion.
 */
export function ParticleLayer({
  kind,
  intensity,
  color,
}: {
  kind: WebParticleEffect;
  intensity: WebIntensity;
  color: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (kind === "none") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // Thanh địa chỉ iOS/Android co giãn khi cuộn bắn rất nhiều sự kiện resize: gom về
    // 1 lần mỗi khung hình, vì mỗi lần gán canvas.width là cấp phát lại bộ nhớ đệm.
    let resizeRaf = 0;
    const onResize = () => {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        if (window.innerWidth !== width || window.innerHeight !== height) resize();
      });
    };

    const isMobile = width < 768;
    const count = isMobile ? COUNT_BY_INTENSITY[intensity].mobile : COUNT_BY_INTENSITY[intensity].desktop;
    const speed = SPEED_BY_INTENSITY[intensity];

    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45 * speed,
      vy:
        kind === "hearts"
          ? -(0.35 + Math.random() * 0.55) * speed
          : kind === "stars"
            ? (Math.random() - 0.5) * 0.15 * speed
            : (0.4 + Math.random() * 0.65) * speed,
      size: kind === "stars" ? 3 + Math.random() * 4.5 : 6 + Math.random() * 6,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.025,
      alpha: 0.22 + Math.random() * 0.35,
      phase: Math.random() * Math.PI * 2,
    }));

    let rafId = 0;
    let paused = document.hidden;

    const tick = (t: number) => {
      if (paused) return;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = color;

      for (const p of particles) {
        p.x += p.vx + Math.sin(t * 0.001 + p.phase) * 0.28;
        p.y += p.vy;
        p.rot += p.vrot;

        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
        } else if (p.y < -20) {
          p.y = height + 20;
          p.x = Math.random() * width;
        }
        if (p.x > width + 20) p.x = -20;
        if (p.x < -20) p.x = width + 20;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha =
          kind === "stars" ? p.alpha * (0.45 + 0.55 * Math.sin(t * 0.0025 + p.phase)) : p.alpha;
        if (kind === "hearts") drawHeart(ctx, p.size);
        else if (kind === "stars") drawStar(ctx, p.size);
        else drawPetal(ctx, p.size);
        ctx.restore();
      }
      rafId = requestAnimationFrame(tick);
    };

    const onVisibility = () => {
      paused = document.hidden;
      if (paused) {
        cancelAnimationFrame(rafId);
      } else {
        rafId = requestAnimationFrame(tick);
      }
    };

    if (!paused) rafId = requestAnimationFrame(tick);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(resizeRaf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [kind, intensity, color]);

  if (kind === "none") return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-10 h-dvh w-screen motion-reduce:hidden"
    >
      <canvas ref={canvasRef} className="size-full" />
    </div>
  );
}
