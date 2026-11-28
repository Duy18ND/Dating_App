"use client";

import { Disc3, Gift, Heart } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { resolveAudioUrl } from "@/lib/audio-tracks";
import { recordView } from "@/lib/client/api";
import { inkOn } from "@/lib/render/ink";
import { cn } from "@/lib/utils";
import { resolveWebStyle } from "@/lib/web-styles";
import type { PublicLetter, WebStyleConfig } from "@/types/letter";
import { LetterContent } from "./LetterContent";

type Step = "sealed" | "opening" | "open";
const OPEN_MS = 1650;
const HOLD_MS = 850;
const RIBBON_THRESHOLD = 72;

function MusicButton({ onToggle, playing }: { onToggle: () => void; playing: boolean }) {
  return (
    <button
      type="button"
      aria-label={playing ? "Tắt nhạc" : "Bật nhạc"}
      aria-pressed={playing}
      onClick={onToggle}
      className="fixed top-[max(0.75rem,env(safe-area-inset-top))] right-[max(0.75rem,env(safe-area-inset-right))] z-40 flex size-11 items-center justify-center rounded-full border bg-card/90 text-primary shadow-md backdrop-blur"
    >
      <Disc3
        className={cn("size-6", playing && "animate-spin motion-reduce:animate-none")}
        style={{ animationDuration: "3s" }}
      />
    </button>
  );
}

/** FR-08 & FR-15: phong bì với 3 kiểu mở (wax_seal, ribbon, hold_heart), hỗ trợ bàn phím và nhạc iOS Safari. */
export function LetterExperience({
  letter,
  recipient,
  preview,
  styleOverride,
  initialStep = "sealed",
}: {
  letter: PublicLetter;
  recipient: string;
  preview?: boolean;
  styleOverride?: WebStyleConfig;
  initialStep?: Step;
}) {
  const { envelopeColor, waxSealColor, senderName, audio: music } = letter.web_config;
  const name = recipient || letter.web_config.recipientName;
  const src = music.enabled ? resolveAudioUrl(music) : null;
  const audioRef = useRef<HTMLAudioElement>(null);
  const seeked = useRef(false);
  const [step, setStep] = useState<Step>(initialStep);
  const openedRef = useRef(initialStep !== "sealed");
  const [playing, setPlaying] = useState(false);

  // Trạng thái cho kiểu mở ribbon (kéo nơ) và hold_heart (nhấn giữ tim)
  const [ribbonPull, setRibbonPull] = useState(0);
  const [dragging, setDragging] = useState(false);
  const ribbonStartX = useRef<number | null>(null);
  /** Quãng kéo xa nhất của lần chạm hiện tại: phân biệt chạm nhanh với kéo dở rồi thả. */
  const ribbonMaxDrag = useRef(0);
  /** Đã mở khi ngón tay còn giữ: thử phát nhạc lại lúc nhấc tay (pointerup). */
  const audioPendingRelease = useRef(false);
  const openTimer = useRef<number | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimer = useRef<number | null>(null);
  const holdStart = useRef<number>(0);

  const resolvedStyle = resolveWebStyle(styleOverride ?? letter.web_config.style);
  const openMode = resolvedStyle.open;

  function startAudioSync() {
    const audio = audioRef.current;
    if (!audio) return;
    // iOS Safari chỉ cho phát nhạc khi play() được gọi ngay trong thao tác chạm của người dùng.
    audio.volume = music.volume;
    if (audio.readyState >= 1) {
      audio.currentTime = music.startTime;
      seeked.current = true;
    }
    audio.play().catch(() => {});
  }

  /**
   * `fromGesture = false` khi mở từ pointermove (kéo nơ) hoặc requestAnimationFrame (giữ tim).
   * Trên màn cảm ứng các sự kiện đó không phải "user activation", nên play() có thể bị chặn:
   * khi đó nhạc được phát lại ở pointerup, sự kiện cảm ứng duy nhất mở khóa được phát nhạc.
   */
  function open(fromGesture = true) {
    if (openedRef.current) return;
    openedRef.current = true;
    startAudioSync();
    if (!fromGesture) audioPendingRelease.current = true;
    if (!preview) recordView(letter.slug);
    setStep("opening");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    openTimer.current = window.setTimeout(() => setStep("open"), reduce ? 0 : OPEN_MS);
  }

  function resumeAudioOnRelease() {
    if (!audioPendingRelease.current) return;
    audioPendingRelease.current = false;
    if (audioRef.current?.paused) startAudioSync();
  }

  function cancelHold() {
    if (holdTimer.current !== null) {
      cancelAnimationFrame(holdTimer.current);
      holdTimer.current = null;
    }
    if (openedRef.current) {
      resumeAudioOnRelease();
      return;
    }
    setHoldProgress(0);
    audioRef.current?.pause();
  }

  function beginHold() {
    if (openedRef.current || holdTimer.current !== null) return;
    // Mở khóa audio ngay trên pointerdown (trong user gesture) để iOS Safari phát nhạc chắc chắn.
    startAudioSync();
    holdStart.current = performance.now();
    const tick = (now: number) => {
      const ratio = Math.min(1, (now - holdStart.current) / HOLD_MS);
      setHoldProgress(ratio);
      if (ratio >= 1) {
        holdTimer.current = null;
        open(false);
      } else {
        holdTimer.current = requestAnimationFrame(tick);
      }
    };
    holdTimer.current = requestAnimationFrame(tick);
  }

  useEffect(() => {
    return () => {
      if (holdTimer.current !== null) cancelAnimationFrame(holdTimer.current);
      if (openTimer.current !== null) window.clearTimeout(openTimer.current);
    };
  }, []);

  const opening = step !== "sealed";
  const ink = inkOn(envelopeColor);
  const t = resolvedStyle.theme.tokens;
  const sealBg = openMode === "wax_seal" ? waxSealColor : resolvedStyle.accent;
  const sealInk = inkOn(sealBg);

  const vars = {
    "--envelope": envelopeColor,
    "--pocket": `color-mix(in srgb, ${envelopeColor} 88%, #000)`,
    "--flap": `color-mix(in srgb, ${envelopeColor} 94%, #000)`,
    backgroundColor: t.bg,
    backgroundImage: t.bgPattern,
    backgroundSize: t.bgSize,
    color: t.ink,
  } as CSSProperties;

  const ringCircumference = 2 * Math.PI * 36;

  return (
    <>
      {src && (
        <audio
          ref={audioRef}
          // #t= để trình duyệt bắt đầu đúng đoạn điệp khúc kể cả khi chưa tải xong metadata.
          src={`${src}#t=${music.startTime}`}
          preload="auto"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onLoadedMetadata={(event) => {
            const audio = event.currentTarget;
            if (!seeked.current && !audio.paused && audio.currentTime < music.startTime) {
              audio.currentTime = music.startTime;
            }
            seeked.current = true;
          }}
          onEnded={(event) => {
            // Lặp lại từ đoạn điệp khúc, không phải từ đầu bài.
            event.currentTarget.currentTime = music.startTime;
            void event.currentTarget.play().catch(() => {});
          }}
        />
      )}
      {src && step === "open" && (
        <MusicButton
          playing={playing}
          onToggle={() => {
            const audio = audioRef.current;
            if (!audio) return;
            if (playing) audio.pause();
            else void audio.play().catch(() => {});
          }}
        />
      )}

      {step === "open" ? (
        <div className="animate-in duration-700 fade-in slide-in-from-bottom-4 motion-reduce:animate-none">
          <LetterContent
            letter={letter}
            recipient={recipient}
            preview={preview}
            styleOverride={styleOverride}
          />
        </div>
      ) : (
        <main
          className="flex min-h-dvh flex-col items-center justify-center gap-7 overflow-hidden px-4 py-10"
          style={vars}
        >
          <div
            className="relative w-[min(88vw,380px)] [perspective:1200px]"
            style={{ aspectRatio: "162 / 114" }}
          >
            {/* Thân sau */}
            <div className="absolute inset-0 rounded-md bg-[var(--envelope)] shadow-xl" />
            {/* Tờ thư bên trong, trượt lên khi mở */}
            <div
              className={cn(
                "absolute inset-x-[7%] top-[6%] bottom-[8%] z-10 rounded-sm bg-[#FDFBF7] shadow transition-transform duration-700 ease-out motion-reduce:transition-none",
                opening && "-translate-y-[45%] delay-500",
              )}
            >
              <div className="mx-auto mt-[12%] h-1 w-1/2 rounded bg-[#E8E1D9]" />
              <div className="mx-auto mt-3 h-1 w-2/3 rounded bg-[#E8E1D9]" />
              <div className="mx-auto mt-3 h-1 w-3/5 rounded bg-[#E8E1D9]" />
            </div>
            {/* Túi trước */}
            <div
              className="absolute inset-0 z-20 rounded-md bg-[var(--pocket)]"
              style={{ clipPath: "polygon(0 0, 50% 54%, 100% 0, 100% 100%, 0 100%)" }}
            />
            <p
              className="absolute inset-x-0 bottom-[10%] z-20 truncate px-6 text-center font-dancing text-2xl sm:text-3xl"
              style={{ color: ink }}
            >
              {name ? `Gửi ${name}` : "Gửi bạn"}
            </p>
            {/* Nắp phong bì */}
            <div
              className={cn(
                "absolute inset-x-0 top-0 h-[60%] origin-top bg-[var(--flap)] [backface-visibility:visible] motion-reduce:transition-none",
                opening
                  ? "z-0 [transform:rotateX(180deg)] [transition:transform_600ms_ease-in-out,z-index_0s_300ms]"
                  : "z-30 [transition:transform_600ms_ease-in-out]",
              )}
              style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
            />

            {/* Kiểu mở 1: Bóc dấu sáp (mặc định) */}
            {openMode === "wax_seal" && (
              <button
                type="button"
                onClick={() => open()}
                disabled={opening}
                aria-label="Bóc dấu sáp để mở thư"
                className={cn(
                  "absolute top-[60%] left-1/2 z-40 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-lg ring-4 ring-black/10 transition duration-300 focus-visible:ring-ring sm:size-20",
                  !opening && "animate-pulse motion-reduce:animate-none",
                  opening && "scale-50 opacity-0",
                )}
                style={{ backgroundColor: waxSealColor }}
              >
                <Heart className="size-7 fill-current" style={{ color: inkOn(waxSealColor) }} />
              </button>
            )}

            {/* Kiểu mở 2: Kéo nơ (ribbon) — hỗ trợ kéo ngang 1:1 và bấm trực tiếp bằng bàn phím */}
            {openMode === "ribbon" && (
              <>
                <div
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute inset-x-0 top-[56%] z-30 h-5 -translate-y-1/2 transition-opacity duration-300",
                    opening && "opacity-0",
                  )}
                  style={{
                    backgroundColor: sealBg,
                    opacity: opening ? 0 : Math.max(0.2, 1 - ribbonPull / (RIBBON_THRESHOLD * 1.4)),
                  }}
                />
                <button
                  type="button"
                  disabled={opening}
                  aria-label="Kéo nơ sang phải hoặc nhấn để mở thư"
                  onPointerDown={(event) => {
                    if (opening) return;
                    event.currentTarget.setPointerCapture(event.pointerId);
                    ribbonStartX.current = event.clientX;
                    ribbonMaxDrag.current = 0;
                    setDragging(true);
                  }}
                  onPointerMove={(event) => {
                    if (ribbonStartX.current === null || opening) return;
                    const dx = Math.max(0, Math.min(110, event.clientX - ribbonStartX.current));
                    ribbonMaxDrag.current = Math.max(ribbonMaxDrag.current, dx);
                    setRibbonPull(dx);
                    if (dx >= RIBBON_THRESHOLD) {
                      ribbonStartX.current = null;
                      open(false);
                    }
                  }}
                  onPointerUp={() => {
                    ribbonStartX.current = null;
                    setDragging(false);
                    if (openedRef.current) resumeAudioOnRelease();
                    else setRibbonPull(0);
                  }}
                  onPointerCancel={() => {
                    ribbonStartX.current = null;
                    setDragging(false);
                    if (!openedRef.current) setRibbonPull(0);
                  }}
                  onClick={() => {
                    // Bàn phím (không có pointerdown) và chạm nhanh không kéo: mở luôn.
                    // Kéo dở rồi thả thì không mở.
                    if (ribbonMaxDrag.current < 12) open();
                    ribbonMaxDrag.current = 0;
                  }}
                  style={{
                    backgroundColor: sealBg,
                    color: sealInk,
                    transform: `translate(calc(-50% + ${ribbonPull}px), -50%)`,
                  }}
                  className={cn(
                    "absolute top-[56%] left-1/2 z-40 flex h-12 touch-none items-center gap-2 rounded-full px-5 text-xs font-semibold shadow-lg ring-4 ring-white/40 duration-300 select-none focus-visible:ring-ring sm:text-sm [-webkit-touch-callout:none]",
                    // Theo ngón tay 1:1 khi kéo; thả tay thì nơ trượt êm về chỗ cũ.
                    dragging ? "transition-opacity" : "transition-[opacity,transform,scale]",
                    opening && "scale-75 opacity-0",
                  )}
                >
                  <Gift className="size-4" />
                  Kéo nơ →
                </button>
              </>
            )}

            {/* Kiểu mở 3: Nhấn giữ tim (hold_heart) — có vòng tiến trình & phím bấm thay thế */}
            {openMode === "hold_heart" && (
              <button
                type="button"
                disabled={opening}
                aria-label="Nhấn giữ trái tim để mở thư, hoặc nhấn Enter để mở ngay"
                onPointerDown={beginHold}
                onPointerUp={cancelHold}
                onPointerLeave={cancelHold}
                onPointerCancel={cancelHold}
                onContextMenu={(event) => event.preventDefault()}
                onClick={(event) => {
                  // detail = 0: kích hoạt từ trình đọc màn hình (VoiceOver/TalkBack), không có thao tác giữ.
                  if (event.detail === 0) open();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    open();
                  }
                }}
                style={{ backgroundColor: sealBg, color: sealInk }}
                className={cn(
                  "absolute top-[60%] left-1/2 z-40 flex size-20 -translate-x-1/2 -translate-y-1/2 touch-none items-center justify-center rounded-full shadow-xl transition duration-300 select-none focus-visible:ring-4 focus-visible:ring-ring [-webkit-touch-callout:none]",
                  holdProgress > 0 && "scale-110",
                  opening && "scale-50 opacity-0",
                )}
              >
                <svg
                  aria-hidden
                  viewBox="0 0 80 80"
                  className="pointer-events-none absolute -inset-1 size-[calc(100%+8px)] -rotate-90"
                >
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="rgba(255,255,255,0.35)"
                    strokeWidth="4"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringCircumference * (1 - holdProgress)}
                  />
                </svg>
                <Heart className="size-8 fill-current" />
              </button>
            )}
          </div>

          <div className={cn("space-y-2 text-center transition-opacity", opening && "opacity-0")}>
            <p className="font-medium">
              {openMode === "ribbon"
                ? "Kéo nơ sang phải (hoặc chạm) để mở thư"
                : openMode === "hold_heart"
                  ? "Nhấn giữ trái tim trong 1 giây để mở thư"
                  : "Chạm vào con dấu để mở thư"}
            </p>
            {openMode !== "wax_seal" && (
              <button
                type="button"
                onClick={() => open()}
                disabled={opening}
                className="text-xs underline underline-offset-4 opacity-80 hover:opacity-100"
              >
                Hoặc bấm nhanh để mở ngay
              </button>
            )}
            {senderName && (
              <p className="text-sm" style={{ color: t.muted }}>
                Từ {senderName}
              </p>
            )}
            {src && (
              <p className="text-xs" style={{ color: t.muted }}>
                Thư có nhạc, hãy bật âm lượng
              </p>
            )}
          </div>
        </main>
      )}
    </>
  );
}
