"use client";

import type { ImageFocus } from "@/types/letter";

const FOCUS_PRESETS: { label: string; focus: ImageFocus }[] = [
  { label: "Trên", focus: { x: 0.5, y: 0.15 } },
  { label: "Giữa", focus: { x: 0.5, y: 0.5 } },
  { label: "Dưới", focus: { x: 0.5, y: 0.85 } },
  { label: "Trái", focus: { x: 0.15, y: 0.5 } },
  { label: "Phải", focus: { x: 0.85, y: 0.5 } },
];

const clamp01 = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 100) / 100;

export function FocusPicker({
  src,
  value,
  onChange,
  onCommit,
}: {
  src: string;
  value: ImageFocus;
  onChange: (focus: ImageFocus) => void;
  onCommit: () => void;
}) {
  function pickAt(event: React.PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    onChange({
      x: clamp01((event.clientX - rect.left) / rect.width),
      y: clamp01((event.clientY - rect.top) / rect.height),
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium">Điểm giữ ảnh</span>
        <span>
          {Math.round(value.x * 100)}% · {Math.round(value.y * 100)}%
        </span>
      </div>
      <div
        role="slider"
        tabIndex={0}
        aria-label="Chọn điểm giữ trên ảnh"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value.x * 100)}
        aria-valuetext={`Ngang ${Math.round(value.x * 100)}%, dọc ${Math.round(value.y * 100)}%`}
        className="relative h-32 w-full cursor-crosshair touch-none overflow-hidden rounded-md border bg-muted"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          pickAt(event);
        }}
        onPointerMove={(event) => {
          if (event.buttons > 0) pickAt(event);
        }}
        onPointerUp={onCommit}
        onKeyDown={(event) => {
          const step = 0.1;
          if (event.key === "ArrowLeft") onChange({ x: clamp01(value.x - step), y: value.y });
          else if (event.key === "ArrowRight") onChange({ x: clamp01(value.x + step), y: value.y });
          else if (event.key === "ArrowUp") onChange({ x: value.x, y: clamp01(value.y - step) });
          else if (event.key === "ArrowDown") onChange({ x: value.x, y: clamp01(value.y + step) });
          else return;
          event.preventDefault();
          onCommit();
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ảnh xem trước nhỏ trong panel */}
        <img
          src={src}
          alt=""
          draggable={false}
          className="pointer-events-none size-full object-contain select-none"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary/80 shadow"
          style={{ left: `${value.x * 100}%`, top: `${value.y * 100}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {FOCUS_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              onChange(preset.focus);
              onCommit();
            }}
            className="rounded border bg-card px-2 py-1 text-xs hover:bg-accent"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
