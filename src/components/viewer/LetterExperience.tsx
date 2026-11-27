"use client";

import { Disc3, Heart } from "lucide-react";
import { useRef, useState, type CSSProperties } from "react";
import { trackUrl } from "@/lib/audio-tracks";
import { recordView } from "@/lib/client/api";
import { cn } from "@/lib/utils";
import type { PublicLetter } from "@/types/letter";
import { LetterContent } from "./LetterContent";

type Step = "sealed" | "opening" | "open";
const OPEN_MS = 1700;

/** Chữ trắng trên phong bì tối, chữ mực trên phong bì sáng. */
function inkOn(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b < 140 ? "#FFFFFF" : "#2B2623";
}

function MusicButton({ onToggle, playing }: { onToggle: () => void; playing: boolean }) {
  return (
    <button
      type="button"
      aria-label={playing ? "Tắt nhạc" : "Bật nhạc"}
      aria-pressed={playing}
      onClick={onToggle}
      className="fixed top-3 right-3 z-40 flex size-11 items-center justify-center rounded-full border bg-card/90 text-primary shadow-md backdrop-blur"
    >
      <Disc3
        className={cn("size-6", playing && "animate-spin motion-reduce:animate-none")}
        style={{ animationDuration: "3s" }}
      />
    </button>
  );
}

/** FR-08: phong bì đóng dấu sáp. Chạm vào dấu thì mở nắp, phát nhạc, rồi hiện lá thư. */
export function LetterExperience({
  letter,
  recipient,
}: {
  letter: PublicLetter;
  recipient: string;
}) {
  const { envelopeColor, waxSealColor, senderName, audio: music } = letter.web_config;
  const name = recipient || letter.web_config.recipientName;
  const src = music.enabled ? trackUrl(music.trackId) : null;
  const audioRef = useRef<HTMLAudioElement>(null);
  const seeked = useRef(false);
  const [step, setStep] = useState<Step>("sealed");
  const [playing, setPlaying] = useState(false);

  function open() {
    if (step !== "sealed") return;
    const audio = audioRef.current;
    if (audio) {
      // iOS Safari chỉ cho phát nhạc khi play() được gọi ngay trong thao tác chạm.
      audio.volume = music.volume;
      if (audio.readyState >= 1) {
        audio.currentTime = music.startTime;
        seeked.current = true;
      }
      audio.play().catch(() => {});
    }
    recordView(letter.slug);
    setStep("opening");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(() => setStep("open"), reduce ? 0 : OPEN_MS);
  }

  const opening = step !== "sealed";
  const ink = inkOn(envelopeColor);
  const vars = {
    "--envelope": envelopeColor,
    "--pocket": `color-mix(in srgb, ${envelopeColor} 88%, #000)`,
    "--flap": `color-mix(in srgb, ${envelopeColor} 94%, #000)`,
  } as CSSProperties;

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
          <LetterContent letter={letter} recipient={recipient} />
        </div>
      ) : (
        <main
          className="flex min-h-dvh flex-col items-center justify-center gap-8 overflow-hidden px-4 py-10"
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
            {/* Túi trước: hai bên và đáy */}
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
            {/* Nắp: lật ra sau rồi nằm dưới tờ thư */}
            <div
              className={cn(
                "absolute inset-x-0 top-0 h-[60%] origin-top bg-[var(--flap)] [backface-visibility:visible] motion-reduce:transition-none",
                opening
                  ? "z-0 [transform:rotateX(180deg)] [transition:transform_600ms_ease-in-out,z-index_0s_300ms]"
                  : "z-30 [transition:transform_600ms_ease-in-out]",
              )}
              style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
            />
            {/* Dấu sáp */}
            <button
              type="button"
              onClick={open}
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
          </div>

          <div className={cn("space-y-1 text-center transition-opacity", opening && "opacity-0")}>
            <p className="font-medium">Chạm vào con dấu để mở thư</p>
            {senderName && <p className="text-sm text-muted-foreground">Từ {senderName}</p>}
            {src && <p className="text-xs text-muted-foreground">Thư có nhạc, hãy bật âm lượng</p>}
          </div>
        </main>
      )}
    </>
  );
}
