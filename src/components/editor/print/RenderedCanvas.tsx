"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Chờ người dùng ngừng gõ rồi mới vẽ lại. */
const REDRAW_DELAY_MS = 300;

/**
 * Hiện một canvas do `draw` tạo ra và vẽ lại khi `draw` đổi (bọc bằng useCallback).
 * Trong lúc vẽ lại vẫn giữ hình cũ cho đỡ nháy.
 */
export function RenderedCanvas({
  draw,
  label,
  ratio,
  className,
}: {
  draw: () => Promise<HTMLCanvasElement>;
  label: string;
  /** Tỷ lệ khung rộng / cao, để giữ chỗ trước khi vẽ xong. */
  ratio: number;
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [drawn, setDrawn] = useState<{ draw: typeof draw; error?: string }>();

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      draw().then(
        (canvas) => {
          if (!active || !host.current) return;
          canvas.className = "block size-full";
          host.current.replaceChildren(canvas);
          setDrawn({ draw });
        },
        (cause) => {
          console.error(cause);
          if (!active) return;
          const message = cause instanceof Error ? cause.message : "Không vẽ được bản xem trước.";
          setDrawn({ draw, error: message });
        },
      );
    }, REDRAW_DELAY_MS);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [draw]);

  const busy = drawn?.draw !== draw;

  return (
    <div
      role="img"
      aria-label={label}
      aria-busy={busy}
      className={cn("relative w-full overflow-hidden", className)}
      style={{ aspectRatio: ratio }}
    >
      <div ref={host} className="absolute inset-0" />
      {busy && (
        <p className="absolute top-2 right-2 rounded-full bg-card/90 px-2 py-0.5 text-xs text-muted-foreground shadow">
          Đang vẽ...
        </p>
      )}
      {!busy && drawn?.error && (
        <p role="alert" className="absolute inset-0 bg-card p-3 text-sm text-destructive">
          {drawn.error}
        </p>
      )}
    </div>
  );
}
