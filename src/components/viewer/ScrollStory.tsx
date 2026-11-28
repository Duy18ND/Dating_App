"use client";

import { ArrowDown, Calendar, Heart, MailOpen, RotateCw, Sparkles } from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { parseLocalDate } from "@/lib/local-date";
import { cn } from "@/lib/utils";
import { isSectionEmpty } from "@/lib/web-sections";
import { cssFontVar, type ResolvedWebStyle } from "@/lib/web-styles";
import type {
  CounterMode,
  MemoryItem,
  PublicLetter,
  WebImage,
  WebIntensity,
  WebPhotoEffect,
  WebTextReveal,
} from "@/types/letter";
import { AcceptBlock, PollBlock, RsvpBlock } from "./blocks";
import { CardZoomModal } from "./CardZoomModal";
import { ParticleLayer } from "./ParticleLayer";
import { StoryBoard } from "./StoryBoard";
import { HeaderGarland, PhotoboothStrip, ScratchCard, WebPhotoFrame } from "./StoryExtras";

function subscribeReducedMotion(cb: () => void) {
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
}

function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/**
 * Hiện khi phần tử đi vào khung nhìn. Dùng rootMargin thay cho threshold theo tỉ lệ:
 * một đoạn thư rất dài trên điện thoại 360px có thể cao gấp 8 lần màn hình, khi đó
 * tỉ lệ giao nhau không bao giờ đạt 14% và nội dung sẽ vô hình mãi mãi.
 */
function useInViewOnce(bottomInsetPct = 12) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: `0px 0px -${bottomInsetPct}% 0px` },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [bottomInsetPct, reduced]);

  return { ref, visible: reduced || seen };
}

const REVEAL_MS: Record<WebIntensity, number> = {
  light: 500,
  medium: 700,
  rich: 850,
};

function Reveal({
  children,
  delayMs = 0,
  intensity = "medium",
  drop = false,
  className,
}: {
  children: ReactNode;
  delayMs?: number;
  intensity?: WebIntensity;
  drop?: boolean;
  className?: string;
}) {
  const { ref, visible } = useInViewOnce();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delayMs}ms`, transitionDuration: `${REVEAL_MS[intensity]}ms` }}
      className={cn(
        "transition-all ease-out motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:opacity-100 motion-reduce:transition-none",
        visible
          ? "translate-y-0 scale-100 opacity-100"
          : drop
            ? "-translate-y-5 scale-105 opacity-0"
            : "translate-y-6 opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Hiển thị văn bản theo hiệu ứng FR-15 (slide / typewriter / lines).
 * Luôn giữ văn bản đầy đủ cho trình đọc màn hình và hiện ngay khi prefers-reduced-motion.
 */
function AnimatedLead({
  text,
  mode,
  intensity,
  className,
  style,
}: {
  text: string;
  mode: WebTextReveal;
  intensity: WebIntensity;
  className?: string;
  style?: CSSProperties;
}) {
  const { ref, visible } = useInViewOnce(18);
  const reduced = useReducedMotion();
  const chars = [...text];
  const [shownCount, setShownCount] = useState(0);

  useEffect(() => {
    if (mode !== "typewriter" || !visible || reduced) return;
    const speed = intensity === "rich" ? 18 : intensity === "light" ? 32 : 24;
    let count = 0;
    const timer = window.setInterval(() => {
      count += 1;
      setShownCount(count);
      if (count >= chars.length) window.clearInterval(timer);
    }, speed);
    return () => window.clearInterval(timer);
  }, [mode, visible, reduced, intensity, chars.length]);

  if (mode === "typewriter" && !reduced) {
    const partial = visible ? chars.slice(0, shownCount).join("") : "";
    return (
      <div ref={ref} className={className} style={style}>
        <span className="sr-only">{text}</span>
        <p aria-hidden="true" className="min-h-[3em]">
          {partial}
          {visible && shownCount < chars.length && (
            <span className="ml-0.5 inline-block h-[1em] w-0.5 animate-pulse bg-current align-middle" />
          )}
        </p>
      </div>
    );
  }

  if (mode === "lines" && !reduced) {
    const sentences = text.split(/(?<=[.!?…])\s+/).filter(Boolean);
    return (
      <div ref={ref} className={cn("space-y-1.5", className)} style={style}>
        {sentences.map((line, i) => (
          <p
            key={i}
            style={{ transitionDelay: `${i * 180}ms` }}
            className={cn(
              "transition-all duration-600 ease-out",
              visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
            )}
          >
            {line}
          </p>
        ))}
      </div>
    );
  }

  return (
    <p ref={ref} className={className} style={style}>
      {text}
    </p>
  );
}

/** Ảnh web FR-16: mặc định hiện trọn ảnh (contain), cover cắt theo điểm giữ focus (0..1). */
function StoryPhoto({
  image,
  alt,
  defaultFit = "contain",
  className,
}: {
  image: WebImage;
  alt: string;
  defaultFit?: "contain" | "cover";
  className?: string;
}) {
  const fit = image.fit ?? defaultFit;
  const fx = Math.round((image.focus?.x ?? 0.5) * 100);
  const fy = Math.round((image.focus?.y ?? 0.5) * 100);
  const zoom = image.zoom ?? 1;
  const picture = (
    // eslint-disable-next-line @next/next/no-img-element -- ảnh người dùng R2 động, cần tải lười và object-position chính xác
    <img
      src={image.src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn(
        "w-full",
        fit === "cover" ? "h-full object-cover" : "h-auto max-h-[70dvh] object-contain",
        className,
      )}
      style={{
        ...(fit === "cover" && { objectPosition: `${fx}% ${fy}%` }),
        ...(zoom > 1 && { transform: `scale(${zoom})`, transformOrigin: `${fx}% ${fy}%` }),
      }}
    />
  );
  const inner =
    zoom > 1 ? (
      <div className={cn("overflow-hidden", fit === "cover" && "h-full")}>{picture}</div>
    ) : (
      picture
    );
  return <WebPhotoFrame frame={image.frame}>{inner}</WebPhotoFrame>;
}

/** Thu nhỏ cả khung ảnh và đặt giữa (WebImage.size). */
const frameSize = (image: WebImage): CSSProperties | undefined =>
  image.size && image.size < 100 ? { width: `${image.size}%`, marginInline: "auto" } : undefined;

function daysBetween(dateIso: string, mode: CounterMode): number | null {
  const target = parseLocalDate(dateIso);
  if (!target) return null;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfTarget = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  ).getTime();
  const diff = Math.round((startOfToday - startOfTarget) / 86_400_000);
  return mode === "since" ? Math.max(0, diff) : Math.max(0, -diff);
}

function formatDateVi(dateIso?: string): string {
  if (!dateIso) return "";
  const parsed = parseLocalDate(dateIso);
  if (!parsed) return dateIso;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

function AnimatedNumber({ target }: { target: number }) {
  const { ref, visible } = useInViewOnce(20);
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!visible || reduced || target <= 0) return;
    const start = performance.now();
    const duration = Math.min(1200, Math.max(450, target * 2));
    let raf = 0;
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [visible, reduced, target]);

  const shown = reduced || target <= 0 ? target : value;
  return (
    <span ref={ref} className="tabular-nums">
      {shown.toLocaleString("vi-VN")}
    </span>
  );
}

/** Kiểu đếm Lịch lật (flip_calendar — FR-15): từng chữ số trong ô lịch giấy có nếp gấp ngang. */
function FlipCalendarDigits({
  target,
  accent,
  surface,
  border,
  headingStyle,
}: {
  target: number;
  accent: string;
  surface: string;
  border: string;
  headingStyle: CSSProperties;
}) {
  const digits = String(target).padStart(2, "0").split("");
  return (
    <div className="flex items-center justify-center gap-2" aria-label={`${target} ngày`}>
      {digits.map((digit, i) => (
        <span
          key={i}
          style={{
            ...headingStyle,
            backgroundColor: surface,
            borderColor: border,
            color: accent,
          }}
          className="relative flex h-16 w-12 items-center justify-center rounded-xl border text-4xl font-bold shadow-xs tabular-nums sm:h-20 sm:w-14 sm:text-5xl"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-1/2 h-px opacity-30"
            style={{ backgroundColor: border }}
          />
          {digit}
        </span>
      ))}
    </div>
  );
}

/** Thẻ kỷ niệm hỗ trợ đủ 3 hiệu ứng ảnh FR-15: polaroid, flip (lật xem lời nhắn), drop. */
function MemoryCard({
  item,
  index,
  photoMode,
  intensity,
  resolvedStyle,
}: {
  item: MemoryItem;
  index: number;
  photoMode: WebPhotoEffect;
  intensity: WebIntensity;
  resolvedStyle: ResolvedWebStyle;
}) {
  const [flipped, setFlipped] = useState(false);
  const t = resolvedStyle.theme.tokens;
  const accent = resolvedStyle.accent;
  const label = `Kỷ niệm ${String(index + 1).padStart(2, "0")}`;

  if (photoMode === "flip") {
    return (
      <Reveal delayMs={index * 70} intensity={intensity}>
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          aria-pressed={flipped}
          className={cn(
            "group flex h-full min-h-44 w-full flex-col justify-between p-5 text-left transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ring",
            t.photoFrameClass,
          )}
          style={{
            borderColor: t.border,
            backgroundColor: flipped ? t.surfaceAlt : t.surface,
          }}
        >
          {!flipped ? (
            <>
              {item.image ? (
                <div
                  className="mb-3 overflow-hidden rounded-lg"
                  style={{ backgroundColor: t.surfaceAlt, ...frameSize(item.image) }}
                >
                  <StoryPhoto image={item.image} alt={item.caption || label} />
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
                  <Sparkles className="size-5" style={{ color: accent }} />
                  <p className="text-base font-semibold">{label}</p>
                  {item.date && (
                    <p className="text-xs" style={{ color: t.muted }}>
                      {formatDateVi(item.date)}
                    </p>
                  )}
                </div>
              )}
              <span
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium"
                style={{ color: accent }}
              >
                <RotateCw className="size-3.5" /> Chạm để lật xem lời nhắn
              </span>
            </>
          ) : (
            <div className="flex flex-1 flex-col justify-between gap-3 py-2">
              <div className="flex items-center justify-between text-xs font-medium" style={{ color: t.muted }}>
                <span>{label}</span>
                {item.date && <span>{formatDateVi(item.date)}</span>}
              </div>
              <p className="text-sm leading-relaxed sm:text-base">{item.caption}</p>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: accent }}>
                <RotateCw className="size-3.5" /> Chạm để lật lại
              </span>
            </div>
          )}
        </button>
      </Reveal>
    );
  }

  return (
    <Reveal delayMs={index * 75} intensity={intensity} drop={photoMode === "drop"}>
      <figure
        className={cn(
          "flex h-full flex-col justify-between p-4 transition-transform duration-300 motion-reduce:transform-none",
          t.photoFrameClass,
          photoMode === "polaroid" &&
            (index % 2 === 0 ? "pb-6 sm:-rotate-1 hover:rotate-0" : "pb-6 sm:rotate-1 hover:rotate-0"),
          photoMode === "drop" &&
            (index % 2 === 0 ? "sm:rotate-[0.75deg] hover:rotate-0" : "sm:-rotate-[0.75deg] hover:rotate-0"),
        )}
        style={{ borderColor: t.border, backgroundColor: t.surface }}
      >
        {item.image ? (
          <div
            className="mb-3 overflow-hidden rounded-lg"
            style={{ backgroundColor: t.surfaceAlt, ...frameSize(item.image) }}
          >
            <StoryPhoto image={item.image} alt={item.caption || label} />
          </div>
        ) : (
          <div
            className="mb-3 flex items-center justify-between border-b pb-2 text-xs font-medium"
            style={{ borderColor: t.border, color: t.muted }}
          >
            <span>{label}</span>
            {item.date && <span>{formatDateVi(item.date)}</span>}
          </div>
        )}
        <figcaption className="space-y-1.5">
          {item.image && item.date && (
            <p className="text-xs font-medium" style={{ color: t.muted }}>
              {formatDateVi(item.date)}
            </p>
          )}
          <p className="text-sm leading-relaxed sm:text-base">{item.caption}</p>
        </figcaption>
      </figure>
    </Reveal>
  );
}

export function ScrollStory({
  letter,
  recipient,
  qrUrl,
  resolvedStyle,
  preview,
}: {
  letter: PublicLetter;
  recipient: string;
  qrUrl: string;
  resolvedStyle: ResolvedWebStyle;
  preview?: boolean;
}) {
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const { blocks, senderName, sections = [] } = letter.web_config;
  const name = recipient || letter.web_config.recipientName;
  const hasBlocks = Boolean(
    blocks.acceptButton?.enabled || blocks.rsvp?.enabled || blocks.poll?.enabled,
  );

  const visibleSections = sections.filter((s) => s.enabled && !isSectionEmpty(s, hasBlocks));
  const {
    theme,
    accent,
    accentInk,
    headingFont,
    bodyFont,
    scriptFont,
    particle,
    intensity,
    textReveal,
    photo,
    counter: counterMode,
    celebrate,
    garland,
    textScale,
  } = resolvedStyle;
  const t = theme.tokens;

  const themeVars = {
    "--background": t.bg,
    "--foreground": t.ink,
    "--card": t.surface,
    "--card-foreground": t.ink,
    "--primary": accent,
    "--primary-foreground": accentInk,
    "--muted": t.surfaceAlt,
    "--muted-foreground": t.muted,
    "--accent": t.surfaceAlt,
    "--accent-foreground": t.ink,
    "--border": t.border,
    "--input": t.border,
    "--story-text": textScale,
    fontFamily: cssFontVar(bodyFont),
    backgroundColor: t.bg,
    backgroundImage: t.bgPattern,
    backgroundSize: t.bgSize,
    color: t.ink,
  } as CSSProperties;

  const headingStyle: CSSProperties = { fontFamily: cssFontVar(headingFont) };
  const scriptStyle: CSSProperties = { fontFamily: cssFontVar(scriptFont) };
  const expiryLabel = formatDateVi(letter.expires_at);

  return (
    <div
      data-theme={theme.id}
      style={themeVars}
      className="story-text relative min-h-dvh w-full overflow-x-clip pb-[max(4rem,env(safe-area-inset-bottom))]"
    >
      <ParticleLayer kind={particle} intensity={intensity} color={accent} />
      <HeaderGarland kind={garland} accent={accent} />

      <main className="relative z-20 mx-auto flex w-full max-w-3xl flex-col gap-14 px-4 pt-[max(2.5rem,env(safe-area-inset-top))] sm:gap-20 sm:px-8">
        {visibleSections.map((section) => {
          switch (section.type) {
            case "hero":
              return (
                <section
                  data-section-id={section.id}
                  key={section.id}
                  className="flex min-h-[78dvh] flex-col items-center justify-center py-8 text-center sm:min-h-[82dvh]"
                >
                  <Reveal intensity={intensity} className="flex w-full max-w-2xl flex-col items-center gap-6">
                    <div
                      className={cn(
                        "inline-flex items-center gap-2 px-3.5 py-1 text-xs font-medium tracking-wider uppercase",
                        t.badgeClass,
                      )}
                      style={{
                        borderColor: t.border,
                        backgroundColor: t.surface,
                        color: t.muted,
                      }}
                    >
                      <Sparkles className="size-3.5" style={{ color: accent }} />
                      {letter.title || "Một lá thư nhỏ"}
                    </div>

                    <h1
                      style={{ ...headingStyle, color: accent }}
                      className="text-balance text-4xl leading-tight font-semibold tracking-tight sm:text-6xl"
                    >
                      {name ? `Gửi ${name}` : "Gửi người thương"}
                    </h1>

                    {section.image && (
                      <div
                        className={cn("w-full max-w-lg overflow-hidden p-2", t.photoFrameClass)}
                        style={{
                          borderColor: t.border,
                          backgroundColor: t.surface,
                          ...frameSize(section.image),
                        }}
                      >
                        <div className="aspect-[4/3] w-full overflow-hidden rounded-xl">
                          <StoryPhoto
                            image={section.image}
                            alt={letter.title || "Ảnh bìa"}
                            defaultFit="cover"
                          />
                        </div>
                      </div>
                    )}

                    {section.lead.trim() && (
                      <AnimatedLead
                        text={section.lead}
                        mode={textReveal}
                        intensity={intensity}
                        className="max-w-xl text-pretty text-base leading-relaxed sm:text-lg"
                        style={{ color: t.muted }}
                      />
                    )}

                    <div
                      className="mt-4 flex flex-col items-center gap-1.5 text-xs tracking-wide"
                      style={{ color: t.muted }}
                    >
                      <span>Lướt xuống để đọc tiếp</span>
                      <ArrowDown
                        aria-hidden
                        className="size-4 animate-bounce motion-reduce:animate-none"
                        style={{ color: accent }}
                      />
                    </div>
                  </Reveal>
                </section>
              );

            case "first_day":
              return (
                <section data-section-id={section.id} key={section.id} className="py-2">
                  <Reveal intensity={intensity}>
                    <article
                      className={cn(
                        "p-6 sm:p-9",
                        t.cardClass,
                        section.image && "grid gap-6 md:grid-cols-12 md:items-center",
                      )}
                      style={{ borderColor: t.border, backgroundColor: t.surface }}
                    >
                      {section.image && (
                        <div
                          className="overflow-hidden rounded-xl md:col-span-5"
                          style={frameSize(section.image)}
                        >
                          <StoryPhoto image={section.image} alt="Ngày đầu tiên" />
                        </div>
                      )}
                      <div className={cn("space-y-4", section.image && "md:col-span-7")}>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                            style={{ backgroundColor: t.surfaceAlt, color: accent }}
                          >
                            <Calendar className="size-3.5" />
                            Ngày đầu tiên
                          </span>
                          {section.date && (
                            <span className="text-xs font-medium" style={{ color: t.muted }}>
                              {formatDateVi(section.date)}
                            </span>
                          )}
                        </div>
                        <p className="text-base leading-relaxed whitespace-pre-line sm:text-lg">
                          {section.text}
                        </p>
                      </div>
                    </article>
                  </Reveal>
                </section>
              );

            case "memories": {
              const items = section.items.filter((it) => it.caption.trim() || it.image);
              return (
                <section data-section-id={section.id} key={section.id} className="space-y-6 py-2">
                  <Reveal intensity={intensity} className="space-y-1 text-center">
                    <p
                      className="text-xs font-medium tracking-widest uppercase"
                      style={{ color: t.muted }}
                    >
                      Góc kỷ niệm
                    </p>
                    <h2 style={headingStyle} className="text-2xl font-semibold sm:text-3xl">
                      {section.title || "Những khoảnh khắc mình nhớ mãi"}
                    </h2>
                  </Reveal>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {items.map((item, index) => (
                      <MemoryCard
                        key={item.id}
                        item={item}
                        index={index}
                        photoMode={photo}
                        intensity={intensity}
                        resolvedStyle={resolvedStyle}
                      />
                    ))}
                  </div>
                </section>
              );
            }

            case "reasons": {
              const items = section.items.filter((r) => r.trim());
              return (
                <section data-section-id={section.id} key={section.id} className="space-y-6 py-2">
                  <Reveal intensity={intensity} className="space-y-1 text-center">
                    <p
                      className="text-xs font-medium tracking-widest uppercase"
                      style={{ color: t.muted }}
                    >
                      Từ những điều nhỏ nhất
                    </p>
                    <h2 style={headingStyle} className="text-2xl font-semibold sm:text-3xl">
                      {section.title || "Điều mình thích ở cậu"}
                    </h2>
                  </Reveal>
                  <ol
                    className={cn("divide-y px-5 py-2 sm:px-8", t.cardClass)}
                    style={{ borderColor: t.border, backgroundColor: t.surface }}
                  >
                    {items.map((reason, idx) => (
                      <li
                        key={idx}
                        className="py-4 first:pt-3 last:pb-3"
                        style={{ borderColor: t.border }}
                      >
                        <Reveal delayMs={idx * 65} intensity={intensity} className="flex items-start gap-4">
                          <span
                            style={{ ...headingStyle, color: accent }}
                            className="shrink-0 pt-0.5 text-xl font-semibold tabular-nums"
                          >
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                          <p className="text-sm leading-relaxed sm:text-base">{reason}</p>
                        </Reveal>
                      </li>
                    ))}
                  </ol>
                </section>
              );
            }

            case "counter": {
              const count = daysBetween(section.date, section.mode);
              return (
                <section data-section-id={section.id} key={section.id} className="py-2">
                  <Reveal intensity={intensity}>
                    <div
                      className={cn(
                        "flex flex-col items-center gap-3 px-6 py-8 text-center sm:py-10",
                        t.cardClass,
                      )}
                      style={{ borderColor: t.border, backgroundColor: t.surfaceAlt }}
                    >
                      <Heart className="size-5" style={{ color: accent }} />
                      {count !== null &&
                        (counterMode === "flip_calendar" ? (
                          <div className="flex flex-col items-center gap-2">
                            <FlipCalendarDigits
                              target={count}
                              accent={accent}
                              surface={t.surface}
                              border={t.border}
                              headingStyle={headingStyle}
                            />
                            <span className="text-sm font-medium" style={{ color: t.muted }}>
                              ngày
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-baseline gap-2">
                            <span
                              style={{ ...headingStyle, color: accent }}
                              className="text-5xl font-semibold tracking-tight sm:text-6xl"
                            >
                              <AnimatedNumber target={count} />
                            </span>
                            <span className="text-base font-medium" style={{ color: t.muted }}>
                              ngày
                            </span>
                          </div>
                        ))}
                      {section.label && (
                        <p className="max-w-md text-sm font-medium sm:text-base">{section.label}</p>
                      )}
                      {section.date && (
                        <p className="text-xs" style={{ color: t.muted }}>
                          Mốc ngày: {formatDateVi(section.date)}
                        </p>
                      )}
                    </div>
                  </Reveal>
                </section>
              );
            }

            case "message": {
              const paragraphs = section.body
                .split(/\n\s*\n/)
                .map((p) => p.trim())
                .filter(Boolean);
              return (
                <section data-section-id={section.id} key={section.id} className="py-2">
                  <Reveal intensity={intensity}>
                    <article
                      className={cn("space-y-5 p-6 sm:p-10", t.cardClass)}
                      style={{ borderColor: t.border, backgroundColor: t.surface }}
                    >
                      {section.title && (
                        <h2
                          style={{ ...headingStyle, color: accent }}
                          className="text-2xl leading-snug font-semibold sm:text-3xl"
                        >
                          {section.title}
                        </h2>
                      )}
                      <div className="space-y-4 text-base leading-[1.85] sm:text-[17px]">
                        {paragraphs.map((paragraph, idx) => (
                          <p key={idx} className="whitespace-pre-line">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </article>
                  </Reveal>
                </section>
              );
            }

            case "interact":
              return (
                <section data-section-id={section.id} key={section.id} className="space-y-5 py-2">
                  <Reveal intensity={intensity} className="space-y-5">
                    {blocks.acceptButton?.enabled && (
                      <AcceptBlock
                        slug={letter.slug}
                        recipient={name}
                        preview={preview}
                        celebrate={celebrate}
                        intensity={intensity}
                        block={blocks.acceptButton}
                      />
                    )}
                    {blocks.rsvp?.enabled && (
                      <RsvpBlock
                        slug={letter.slug}
                        recipient={name}
                        preview={preview}
                        block={blocks.rsvp}
                      />
                    )}
                    {blocks.poll?.enabled && (
                      <PollBlock
                        slug={letter.slug}
                        recipient={name}
                        preview={preview}
                        block={blocks.poll}
                      />
                    )}
                  </Reveal>
                </section>
              );

            case "photobooth":
              return (
                <section data-section-id={section.id} key={section.id} className="py-2">
                  <Reveal intensity={intensity}>
                    <PhotoboothStrip
                      title={section.title}
                      caption={section.caption}
                      dateLabel={formatDateVi(section.date)}
                      stripColor={section.stripColor}
                      layout={section.layout}
                      animation={section.animation}
                      photos={section.photos}
                      headingStyle={headingStyle}
                      scriptStyle={scriptStyle}
                      accent={accent}
                      mutedColor={t.muted}
                    />
                  </Reveal>
                </section>
              );

            case "scratch":
              return (
                <section data-section-id={section.id} key={section.id} className="py-2">
                  <Reveal intensity={intensity}>
                    <ScratchCard
                      prompt={section.prompt}
                      secret={section.secret}
                      foilColor={section.foilColor}
                      surface={t.surface}
                      border={t.border}
                      accent={accent}
                      headingStyle={headingStyle}
                    />
                  </Reveal>
                </section>
              );

            case "board":
              return (
                <section data-section-id={section.id} key={section.id} className="py-2">
                  <Reveal intensity={intensity}>
                    <StoryBoard section={section} />
                  </Reveal>
                </section>
              );

            case "ending":
              return (
                <section data-section-id={section.id} key={section.id} className="py-4 text-center">
                  <Reveal intensity={intensity} className="mx-auto flex max-w-xl flex-col items-center gap-5">
                    <p className="text-pretty text-base leading-relaxed sm:text-lg">
                      {section.text}
                    </p>
                    {(section.signature || senderName) && (
                      <p style={{ ...scriptStyle, color: accent }} className="text-3xl sm:text-4xl">
                        {section.signature || `Từ ${senderName}`}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => setCardModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition hover:opacity-90"
                      style={{
                        borderColor: accent,
                        backgroundColor: t.surface,
                        color: accent,
                      }}
                    >
                      <MailOpen className="size-4" />
                      Xem lại tấm thiệp
                    </button>

                    <div
                      className="mt-6 w-full space-y-2 border-t pt-6 text-xs"
                      style={{ borderColor: t.border, color: t.muted }}
                    >
                      <p>
                        Mẹo nhỏ: bạn có thể quay màn hình lại để giữ làm kỷ niệm
                        {expiryLabel && !preview ? ` (thư sẽ tự xóa sau ngày ${expiryLabel})` : ""}.
                      </p>
                      <p>
                        Tạo bằng Thư Nhỏ ·{" "}
                        <Link
                          href="/"
                          className="font-medium underline underline-offset-4"
                          style={{ color: accent }}
                        >
                          Làm một lá thư miễn phí
                        </Link>
                      </p>
                    </div>
                  </Reveal>
                </section>
              );
          }
        })}

        {/* Phần kết bị tắt hoặc để trống: vẫn giữ nút xem thiệp và chân trang. */}
        {!visibleSections.some((s) => s.type === "ending") && (
          <footer
            className="flex flex-col items-center gap-4 border-t pt-6 text-center text-xs"
            style={{ borderColor: t.border, color: t.muted }}
          >
            <button
              type="button"
              onClick={() => setCardModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition hover:opacity-90"
              style={{ borderColor: accent, backgroundColor: t.surface, color: accent }}
            >
              <MailOpen className="size-4" />
              Xem lại tấm thiệp
            </button>
            <p>
              Tạo bằng Thư Nhỏ ·{" "}
              <Link href="/" className="font-medium underline underline-offset-4" style={{ color: accent }}>
                Làm một lá thư miễn phí
              </Link>
            </p>
          </footer>
        )}
      </main>

      <CardZoomModal
        letter={letter}
        qrUrl={qrUrl}
        open={cardModalOpen}
        onClose={() => setCardModalOpen(false)}
      />
    </div>
  );
}
