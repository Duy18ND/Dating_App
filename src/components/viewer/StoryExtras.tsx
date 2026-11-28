"use client";

import { RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { inkOn } from "@/lib/render/ink";
import { cn } from "@/lib/utils";
import type {
  ImageFrame,
  PhotoboothAnimation,
  PhotoboothLayout,
  WebGarland,
  WebImage,
} from "@/types/letter";

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

const POLAROID_TILTS = [-3.2, 2.4, -1.8, 3.1, -2.5, 1.9, -2.8, 2.2];

function PhotoboothPhoto({
  photo,
  index,
  caption,
  aspectClass = "aspect-[4/3]",
  animateSnap,
  animateDrop,
  tiltDeg = 0,
  showIndex,
  stripInk,
}: {
  photo: WebImage;
  index: number;
  caption?: string;
  aspectClass?: string;
  animateSnap?: boolean;
  animateDrop?: boolean;
  tiltDeg?: number;
  showIndex?: boolean;
  stripInk?: string;
}) {
  const fx = Math.round((photo.focus?.x ?? 0.5) * 100);
  const fy = Math.round((photo.focus?.y ?? 0.5) * 100);
  const zoom = photo.zoom ?? 1;
  const fitClass = photo.fit === "contain" ? "object-contain" : "object-cover";
  const delayStyle = {
    "--pb-delay": `${index * 190}ms`,
    "--pb-tilt": `${tiltDeg}deg`,
    "--pb-start-tilt": `${tiltDeg > 0 ? tiltDeg + 5 : tiltDeg - 5}deg`,
  } as CSSProperties;

  const img = (
    <div className={cn("relative w-full overflow-hidden rounded-sm bg-black/5", aspectClass)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- ảnh người dùng R2 */}
      <img
        src={photo.src}
        alt={caption || `Ảnh photobooth ${index + 1}`}
        loading="lazy"
        decoding="async"
        className={cn("h-full w-full", fitClass)}
        style={{
          objectPosition: `${fx}% ${fy}%`,
          ...(zoom > 1 && { transform: `scale(${zoom})`, transformOrigin: `${fx}% ${fy}%` }),
        }}
      />
      {showIndex && (
        <span
          aria-hidden
          className="pointer-events-none absolute right-1.5 bottom-1 rounded bg-black/45 px-1.5 py-0.5 font-mono text-[10px] text-white/95"
        >
          {String(index + 1).padStart(2, "0")}
        </span>
      )}
      {animateSnap && (
        <span
          aria-hidden
          style={delayStyle}
          className="pb-anim-flash pointer-events-none absolute inset-0 bg-white"
        />
      )}
    </div>
  );

  const framed = photo.frame && photo.frame !== "none" ? (
    <WebPhotoFrame frame={photo.frame}>{img}</WebPhotoFrame>
  ) : (
    img
  );

  return (
    <div
      style={{ ...delayStyle, color: stripInk }}
      className={cn(
        animateSnap && "pb-anim-snap",
        animateDrop && "pb-anim-drop",
      )}
    >
      {framed}
    </div>
  );
}

function SprocketRow({ count = 14, color }: { count?: number; color: string }) {
  return (
    <div aria-hidden className="flex items-center justify-between gap-1.5 px-2 py-1.5">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="h-2.5 w-3.5 shrink-0 rounded-[2px] opacity-85"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

/** Dải ảnh Photobooth kiểu Hàn Quốc: 4 kiểu khung (dải dọc, lưới 2×2, cuộn phim, polaroid) + 4 hiệu ứng animation. */
export function PhotoboothStrip({
  title,
  caption,
  dateLabel,
  stripColor = "#FFFDF9",
  layout = "strip",
  animation = "print_slide",
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
  layout?: PhotoboothLayout;
  animation?: PhotoboothAnimation;
  photos: WebImage[];
  headingStyle: CSSProperties;
  scriptStyle: CSSProperties;
  accent: string;
  mutedColor: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const [playKey, setPlayKey] = useState(0);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const stripInk = inkOn(stripColor);
  const isDarkStrip = stripInk === "#FFFFFF";
  const sprocketHole = isDarkStrip ? "#F5F1EB" : "#26211F";
  const activeAnim = seen ? animation : "none";
  const animPrint = activeAnim === "print_slide";
  const animSnap = activeAnim === "flash_snap";
  const animDrop = activeAnim === "polaroid_drop";
  const animMarquee = animation === "film_scroll" && photos.length >= 2;
  const canReplay =
    animation === "print_slide" || animation === "flash_snap" || animation === "polaroid_drop";

  const footer = (
    <div className="space-y-1 pt-2.5 text-center">
      {caption && (
        <p style={{ ...scriptStyle, color: stripInk }} className="text-xl leading-snug">
          {caption}
        </p>
      )}
      <p className="font-mono text-[10px] tracking-[0.22em] uppercase opacity-70" style={{ color: stripInk }}>
        {dateLabel || "THƯ NHỎ PHOTOBOOTH"}
      </p>
      <div aria-hidden className="mx-auto mt-1.5 flex items-center justify-center gap-0.5 opacity-60">
        {[2, 1, 3, 1, 2, 1, 1, 3, 1, 2, 2, 1].map((w, i) => (
          <span
            key={i}
            className="block h-2.5 rounded-[0.5px]"
            style={{ width: `${w * 2}px`, backgroundColor: i % 4 === 0 ? accent : stripInk }}
          />
        ))}
      </div>
    </div>
  );

  let body: ReactNode;

  if (animMarquee) {
    const reelPhotos = [...photos, ...photos];
    const durationSec = Math.max(12, photos.length * 3.8);
    body = (
      <div
        className="pb-marquee-wrap w-full overflow-hidden rounded-xl border shadow-md"
        style={{ backgroundColor: stripColor, color: stripInk, borderColor: "rgba(0,0,0,0.14)" }}
      >
        <SprocketRow count={18} color={sprocketHole} />
        <div
          className="pb-anim-marquee flex w-max gap-3 px-3 py-1"
          style={{ "--pb-marquee-s": `${durationSec}s` } as CSSProperties}
        >
          {reelPhotos.map((photo, idx) => (
            <div key={`${photo.src}-${idx}`} className="w-[185px] shrink-0 sm:w-[220px]">
              <PhotoboothPhoto
                photo={photo}
                index={idx % photos.length}
                caption={caption}
                aspectClass={layout === "polaroid" ? "aspect-square" : "aspect-[4/3]"}
                showIndex
                stripInk={stripInk}
              />
            </div>
          ))}
        </div>
        <SprocketRow count={18} color={sprocketHole} />
        <div className="px-4 pb-4">{footer}</div>
      </div>
    );
  } else if (layout === "grid2x2") {
    body = (
      <div
        key={`${layout}-${animation}-${playKey}`}
        className={cn(
          "w-full max-w-[440px] rounded-xl border p-3.5 pb-5 shadow-md",
          animPrint && "pb-anim-print",
        )}
        style={{ backgroundColor: stripColor, color: stripInk, borderColor: "rgba(0,0,0,0.12)" }}
      >
        <div className="mb-2.5 flex items-center justify-between px-0.5 font-mono text-[10px] tracking-[0.2em] uppercase opacity-70">
          <span>LIFE4CUTS</span>
          <span>{dateLabel || `${photos.length} CUTS`}</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {photos.map((photo, index) => (
            <PhotoboothPhoto
              key={`${photo.src}-${index}`}
              photo={photo}
              index={index}
              caption={caption}
              aspectClass="aspect-[4/3]"
              animateSnap={animSnap}
              animateDrop={animDrop}
              showIndex
              stripInk={stripInk}
            />
          ))}
        </div>
        {footer}
      </div>
    );
  } else if (layout === "film") {
    body = (
      <div
        key={`${layout}-${animation}-${playKey}`}
        className={cn(
          "w-full max-w-[340px] overflow-hidden rounded-xl border shadow-md",
          animPrint && "pb-anim-print",
        )}
        style={{ backgroundColor: stripColor, color: stripInk, borderColor: "rgba(0,0,0,0.16)" }}
      >
        <div className="flex">
          {/* Lề đục lỗ trái */}
          <div aria-hidden className="flex w-6 shrink-0 flex-col justify-around py-3 pl-1.5">
            {Array.from({ length: Math.max(8, photos.length * 3) }, (_, i) => (
              <span
                key={i}
                className="h-3 w-3 rounded-[2px] opacity-85"
                style={{ backgroundColor: sprocketHole }}
              />
            ))}
          </div>
          {/* Cột khung phim giữa */}
          <div className="min-w-0 flex-1 space-y-2.5 py-3">
            <div className="flex items-center justify-between font-mono text-[9px] tracking-[0.2em] uppercase opacity-70">
              <span>35MM · 400</span>
              <span>THƯ NHỎ</span>
            </div>
            {photos.map((photo, index) => (
              <PhotoboothPhoto
                key={`${photo.src}-${index}`}
                photo={photo}
                index={index}
                caption={caption}
                aspectClass="aspect-[3/2]"
                animateSnap={animSnap}
                animateDrop={animDrop}
                showIndex
                stripInk={stripInk}
              />
            ))}
            {footer}
          </div>
          {/* Lề đục lỗ phải */}
          <div aria-hidden className="flex w-6 shrink-0 flex-col justify-around py-3 pr-1.5 items-end">
            {Array.from({ length: Math.max(8, photos.length * 3) }, (_, i) => (
              <span
                key={i}
                className="h-3 w-3 rounded-[2px] opacity-85"
                style={{ backgroundColor: sprocketHole }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  } else if (layout === "polaroid") {
    body = (
      <div
        key={`${layout}-${animation}-${playKey}`}
        className={cn(
          "w-full max-w-[460px] space-y-4",
          animPrint && "pb-anim-print",
        )}
      >
        <div className="grid grid-cols-2 gap-3.5 sm:gap-5">
          {photos.map((photo, index) => {
            const tilt = POLAROID_TILTS[index % POLAROID_TILTS.length];
            const cardStyle = {
              backgroundColor: stripColor,
              color: stripInk,
              borderColor: "rgba(0,0,0,0.1)",
              "--pb-delay": `${index * 190}ms`,
              "--pb-tilt": `${tilt}deg`,
              "--pb-start-tilt": `${tilt > 0 ? tilt + 5 : tilt - 5}deg`,
              ...(animDrop ? {} : { transform: `rotate(${tilt}deg)` }),
            } as CSSProperties;
            return (
              <div
                key={`${photo.src}-${index}`}
                style={cardStyle}
                className={cn(
                  "rounded-sm border p-2 pb-6 shadow-md transition-transform duration-200 hover:z-10 hover:rotate-0 hover:scale-[1.03]",
                  animDrop && "pb-anim-drop",
                )}
              >
                <PhotoboothPhoto
                  photo={photo}
                  index={index}
                  caption={caption}
                  aspectClass="aspect-square"
                  animateSnap={animSnap}
                  stripInk={stripInk}
                />
                <p className="mt-2 text-center font-mono text-[10px] tracking-widest opacity-65">
                  #{String(index + 1).padStart(2, "0")}
                </p>
              </div>
            );
          })}
        </div>
        {(caption || dateLabel) && (
          <div className="text-center">
            {caption && (
              <p style={{ ...scriptStyle, color: accent }} className="text-xl leading-snug">
                {caption}
              </p>
            )}
            {dateLabel && (
              <p className="mt-0.5 font-mono text-[11px] tracking-widest uppercase" style={{ color: mutedColor }}>
                {dateLabel}
              </p>
            )}
          </div>
        )}
      </div>
    );
  } else {
    // strip (mặc định kiểu dải dọc Life4Cuts Hàn Quốc)
    body = (
      <div
        key={`${layout}-${animation}-${playKey}`}
        className={cn(
          "w-full max-w-[300px] space-y-2.5 rounded-xl border p-3.5 pb-5 shadow-md sm:max-w-[330px]",
          animPrint && "pb-anim-print",
        )}
        style={{ backgroundColor: stripColor, color: stripInk, borderColor: "rgba(0,0,0,0.12)" }}
      >
        {photos.map((photo, index) => (
          <PhotoboothPhoto
            key={`${photo.src}-${index}`}
            photo={photo}
            index={index}
            caption={caption}
            aspectClass="aspect-[4/3]"
            animateSnap={animSnap}
            animateDrop={animDrop}
            showIndex
            stripInk={stripInk}
          />
        ))}
        {footer}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="flex flex-col items-center gap-4">
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

      {/* Khe nhả ảnh kiểu máy photobooth khi bật hiệu ứng In trượt ra */}
      {animation === "print_slide" && !animMarquee ? (
        <div className="flex w-full flex-col items-center">
          <div
            aria-hidden
            className="z-10 h-3.5 w-full max-w-[360px] rounded-full border border-black/15 bg-black/15 shadow-inner"
            style={{ maxWidth: layout === "grid2x2" || layout === "polaroid" ? 470 : 360 }}
          />
          <div className="-mt-1.5 flex w-full justify-center overflow-hidden pt-2 pb-2">
            {body}
          </div>
        </div>
      ) : (
        body
      )}

      {canReplay && (
        <button
          type="button"
          onClick={() => {
            setSeen(true);
            setPlayKey((k) => k + 1);
          }}
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium opacity-75 transition-opacity hover:opacity-100"
          style={{ color: mutedColor, borderColor: "rgba(0,0,0,0.12)" }}
        >
          <RotateCcw className="size-3" /> Xem lại hiệu ứng
        </button>
      )}
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
