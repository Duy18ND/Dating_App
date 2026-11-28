"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { inkOn } from "@/lib/render/ink";
import { cn } from "@/lib/utils";
import type { ImageFrame, WebGarland, WebImage } from "@/types/letter";

/** Băng rôn / dây treo trang trí đầu trang web (nhẹ, vector SVG, tôn trọng reduced-motion). */
export function HeaderGarland({ kind, accent }: { kind: WebGarland; accent: string }) {
  if (kind === "none") return null;

  if (kind === "bunting") {
    const colors = [accent, "#E8C36B", "#F28A9E", "#7CA588", "#E89B6B", accent, "#F28A9E", "#E8C36B"];
    return (
      <div aria-hidden className="pointer-events-none relative z-20 w-full overflow-hidden">
        <svg viewBox="0 0 800 72" className="mx-auto h-12 w-full max-w-4xl sm:h-16" preserveAspectRatio="none">
          <path d="M0 8 Q400 54 800 8" fill="none" stroke="rgba(43,38,35,0.28)" strokeWidth="2.5" />
          {colors.map((fill, i) => {
            const x1 = 36 + i * 94;
            const x2 = x1 + 66;
            const xm = (x1 + x2) / 2;
            const t = xm / 800;
            const yTop = 8 + 4 * 46 * t * (1 - t);
            return (
              <polygon
                key={i}
                points={`${x1},${yTop - 3} ${x2},${yTop - 3} ${xm},${yTop + 34}`}
                fill={fill}
                opacity="0.9"
              />
            );
          })}
        </svg>
      </div>
    );
  }

  if (kind === "lights") {
    const bulbs = Array.from({ length: 11 }, (_, i) => i);
    return (
      <div aria-hidden className="pointer-events-none relative z-20 w-full overflow-hidden">
        <svg viewBox="0 0 800 66" className="mx-auto h-12 w-full max-w-4xl sm:h-14" preserveAspectRatio="none">
          <path d="M0 10 Q400 46 800 10" fill="none" stroke="rgba(43,38,35,0.32)" strokeWidth="2" />
          {bulbs.map((i) => {
            const cx = 42 + i * 71;
            const t = cx / 800;
            const cy = 10 + 4 * 36 * t * (1 - t) + 12;
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r="13" fill="#F8D47C" opacity="0.28" />
                <circle cx={cx} cy={cy} r="6.5" fill="#FFE6A3" stroke="#D9A84E" strokeWidth="1.2" />
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  // hearts
  const hearts = Array.from({ length: 9 }, (_, i) => i);
  return (
    <div aria-hidden className="pointer-events-none relative z-20 w-full overflow-hidden">
      <svg viewBox="0 0 800 72" className="mx-auto h-12 w-full max-w-4xl sm:h-16" preserveAspectRatio="none">
        <path d="M0 10 Q400 44 800 10" fill="none" stroke="rgba(184,59,99,0.28)" strokeWidth="2" />
        {hearts.map((i) => {
          const cx = 60 + i * 85;
          const t = cx / 800;
          const yTop = 10 + 4 * 34 * t * (1 - t);
          const drop = i % 2 === 0 ? 18 : 28;
          return (
            <g key={i}>
              <line x1={cx} y1={yTop} x2={cx} y2={yTop + drop} stroke="rgba(184,59,99,0.3)" strokeWidth="1.2" />
              <path
                d={`M${cx} ${yTop + drop + 12} C${cx - 10} ${yTop + drop + 4} ${cx - 9} ${yTop + drop - 4} ${cx} ${yTop + drop + 1} C${cx + 9} ${yTop + drop - 4} ${cx + 10} ${yTop + drop + 4} ${cx} ${yTop + drop + 12} Z`}
                fill={i % 2 === 0 ? accent : "#F28A9E"}
                opacity="0.9"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

const CLIP_PATHS: Partial<Record<ImageFrame, string>> = {
  heart:
    "path('M 0.5 0.96 C 0.05 0.68 -0.02 0.28 0.22 0.1 C 0.36 0 0.47 0.12 0.5 0.3 C 0.53 0.12 0.64 0 0.78 0.1 C 1.02 0.28 0.95 0.68 0.5 0.96 Z')",
  star: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
  arch: "inset(0 round 50% 50% 0 0)",
};

/** Khung cắt ảnh CSS cho ảnh trên trang web (tròn, trái tim, vòm, sao, polaroid, băng dính, dải phim). */
export function WebPhotoFrame({
  frame,
  children,
  className,
}: {
  frame?: ImageFrame;
  children: ReactNode;
  className?: string;
}) {
  if (!frame || frame === "none") return <>{children}</>;

  if (frame === "polaroid") {
    return (
      <div className={cn("rounded-sm bg-white p-2 pb-8 shadow-md", className)}>
        <div className="overflow-hidden">{children}</div>
      </div>
    );
  }
  if (frame === "tape") {
    return (
      <div className={cn("relative bg-white p-2 shadow-sm", className)}>
        <span
          aria-hidden
          className="pointer-events-none absolute -top-2 left-3 z-10 h-4 w-12 -rotate-12 bg-[#E8CEAA]/85"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -top-2 right-3 z-10 h-4 w-12 rotate-12 bg-[#E8CEAA]/85"
        />
        <div className="overflow-hidden rounded-xs">{children}</div>
      </div>
    );
  }
  if (frame === "film") {
    return (
      <div className={cn("relative rounded-md bg-[#1E1B1A] px-4 py-2.5 shadow-md", className)}>
        <div className="overflow-hidden rounded-xs">{children}</div>
      </div>
    );
  }
  if (frame === "circle") {
    return (
      <div className={cn("mx-auto aspect-square overflow-hidden rounded-full", className)}>
        {children}
      </div>
    );
  }
  if (frame === "heart") {
    return (
      <div
        className={cn("mx-auto aspect-square overflow-hidden", className)}
        style={{
          clipPath:
            "polygon(50% 94%, 15% 65%, 3% 43%, 4% 25%, 14% 11%, 28% 6%, 42% 12%, 50% 23%, 58% 12%, 72% 6%, 86% 11%, 96% 25%, 97% 43%, 85% 65%)",
        }}
      >
        {children}
      </div>
    );
  }
  if (frame === "star" || frame === "arch") {
    return (
      <div
        className={cn("mx-auto aspect-square overflow-hidden", className)}
        style={{ clipPath: CLIP_PATHS[frame] }}
      >
        {children}
      </div>
    );
  }
  return <div className={cn("overflow-hidden rounded-2xl", className)}>{children}</div>;
}

/** Dải ảnh Photobooth kiểu Hàn Quốc (2–4 ảnh dọc, chân dải ảnh có chú thích và ngày). */
export function PhotoboothStrip({
  title,
  caption,
  dateLabel,
  stripColor = "#FFFDF9",
  photos,
  headingStyle,
  scriptStyle,
  accent,
  mutedColor,
}: {
  title?: string;
  caption?: string;
  dateLabel?: string;
  stripColor?: string;
  photos: WebImage[];
  headingStyle: CSSProperties;
  scriptStyle: CSSProperties;
  accent: string;
  mutedColor: string;
}) {
  const stripInk = inkOn(stripColor);
  return (
    <div className="flex flex-col items-center gap-5">
      {title && (
        <div className="space-y-1 text-center">
          <p className="text-xs font-medium tracking-widest uppercase" style={{ color: mutedColor }}>
            Photobooth
          </p>
          <h2 style={headingStyle} className="text-2xl font-semibold sm:text-3xl">
            {title}
          </h2>
        </div>
      )}
      <div
        className="w-full max-w-[300px] space-y-3 rounded-xl border p-3.5 pb-6 shadow-md sm:max-w-[330px]"
        style={{ backgroundColor: stripColor, color: stripInk, borderColor: "rgba(0,0,0,0.12)" }}
      >
        {photos.map((photo, index) => {
          const fx = Math.round((photo.focus?.x ?? 0.5) * 100);
          const fy = Math.round((photo.focus?.y ?? 0.5) * 100);
          const zoom = photo.zoom ?? 1;
          return (
            <div key={`${photo.src}-${index}`} className="aspect-[4/3] w-full overflow-hidden rounded-sm bg-black/5">
              {/* eslint-disable-next-line @next/next/no-img-element -- ảnh người dùng R2 */}
              <img
                src={photo.src}
                alt={caption || `Ảnh photobooth ${index + 1}`}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
                style={{
                  objectPosition: `${fx}% ${fy}%`,
                  ...(zoom > 1 && { transform: `scale(${zoom})`, transformOrigin: `${fx}% ${fy}%` }),
                }}
              />
            </div>
          );
        })}
        <div className="space-y-1 pt-2 text-center">
          {caption && (
            <p style={{ ...scriptStyle, color: stripInk }} className="text-xl leading-snug">
              {caption}
            </p>
          )}
          <p className="text-[11px] tracking-widest uppercase opacity-70" style={{ color: stripInk }}>
            {dateLabel || "THƯ NHỎ PHOTOBOOTH"}
          </p>
          <span
            aria-hidden
            className="mx-auto mt-1 block h-1 w-8 rounded-full opacity-70"
            style={{ backgroundColor: accent }}
          />
        </div>
      </div>
    </div>
  );
}

/** Thẻ cào lớp nhũ bí mật trên trang web: quẹt tay cào hoặc bấm nút Mở nhanh. */
export function ScratchCard({
  prompt,
  secret,
  foilColor = "#D9B36C",
  surface,
  border,
  accent,
  headingStyle,
}: {
  prompt: string;
  secret: string;
  foilColor?: string;
  surface: string;
  border: string;
  accent: string;
  headingStyle: CSSProperties;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [revealed, setRevealed] = useState(false);
  const drawingRef = useRef(false);
  const strokesRef = useRef(0);

  useEffect(() => {
    if (revealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(260, Math.round(rect.width));
    const h = Math.max(150, Math.round(rect.height));
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, foilColor);
    grad.addColorStop(0.5, "#FFF2D6");
    grad.addColorStop(1, foilColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Hạt nhũ nhẹ trên bề mặt
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    for (let i = 0; i < 42; i++) {
      const sx = ((i * 73) % 97) * (w / 97);
      const sy = ((i * 41) % 89) * (h / 89);
      ctx.beginPath();
      ctx.arc(sx, sy, (i % 3) + 1, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = inkOn(foilColor);
    ctx.font = "600 15px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(prompt || "Quẹt tay cào để xem bí mật ✨", w / 2, h / 2);
  }, [foilColor, prompt, revealed]);

  function scratchAt(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 24, 0, Math.PI * 2);
    ctx.fill();
    strokesRef.current += 1;
    // Kiểm tra phần trăm đã cào mỗi 12 nét để mượt 60fps
    if (strokesRef.current % 12 === 0) {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let cleared = 0;
      const total = data.length / 4;
      for (let i = 3; i < data.length; i += 16) {
        if (data[i] === 0) cleared += 4;
      }
      if (cleared / total > 0.42) setRevealed(true);
    }
  }

  return (
    <div
      className="mx-auto max-w-md space-y-3 rounded-2xl border p-5 text-center shadow-xs"
      style={{ backgroundColor: surface, borderColor: border }}
    >
      <div className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider" style={{ color: accent }}>
        <Sparkles className="size-3.5" /> Thẻ cào bí mật
      </div>
      <div
        className="relative flex min-h-[160px] items-center justify-center overflow-hidden rounded-xl border p-5"
        style={{ borderColor: border, backgroundColor: surface }}
      >
        <p style={headingStyle} className="text-lg leading-relaxed font-medium whitespace-pre-line sm:text-xl">
          {secret}
        </p>
        {!revealed && (
          <canvas
            ref={canvasRef}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              drawingRef.current = true;
              scratchAt(event.clientX, event.clientY);
            }}
            onPointerMove={(event) => {
              if (drawingRef.current) scratchAt(event.clientX, event.clientY);
            }}
            onPointerUp={() => {
              drawingRef.current = false;
            }}
            onPointerCancel={() => {
              drawingRef.current = false;
            }}
            className="absolute inset-0 h-full w-full cursor-pointer touch-none"
          />
        )}
      </div>
      {!revealed && (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="text-xs font-medium underline underline-offset-4 opacity-75 hover:opacity-100"
          style={{ color: accent }}
        >
          Chạm để mở nhanh
        </button>
      )}
    </div>
  );
}
