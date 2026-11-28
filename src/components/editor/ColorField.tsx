"use client";

import { Pipette } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { hexToHsv, hsvToHex, normalizeHex } from "@/lib/color";
import { cn } from "@/lib/utils";

/**
 * Bảng màu gợi ý kèm bộ chọn màu tùy chỉnh kiểu Canva:
 * - Ô kéo Sáng/Đậm + thanh Tông màu (Hue)
 * - Ô nhập trực tiếp mã HEX (#FFF hoặc #8E2424), không hiện bảng RGB mặc định của trình duyệt.
 */
export function ColorField({
  label,
  colors,
  value,
  onChange,
  onCommit,
}: {
  label: string;
  colors: readonly string[];
  value: string;
  /** `custom` = đang kéo trong bộ chọn màu, gộp các lần gọi vào một bước Undo. */
  onChange: (color: string, custom: boolean) => void;
  onCommit?: () => void;
}) {
  const normalized = normalizeHex(value) ?? "#8E2424";
  const [open, setOpen] = useState(false);
  const [savedHue, setSavedHue] = useState(() => hexToHsv(normalized).h);
  const [editingDraft, setEditingDraft] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const padRef = useRef<HTMLDivElement>(null);

  const parsedHsv = hexToHsv(normalized);
  // Giữ nguyên Hue khi màu đang là trắng/đen/xám để thanh trượt tông màu không bị nhảy.
  const hsv = parsedHsv.s === 0 || parsedHsv.v === 0 ? { ...parsedHsv, h: savedHue } : parsedHsv;
  const draft = editingDraft ?? normalized;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setEditingDraft(null);
        onCommit?.();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setEditingDraft(null);
        onCommit?.();
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onCommit]);

  function applyHsv(nextH: number, nextS: number, nextV: number) {
    setSavedHue(nextH);
    setEditingDraft(null);
    onChange(hsvToHex(nextH, nextS, nextV), true);
  }

  function pickFromPad(clientX: number, clientY: number) {
    const rect = padRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    const s = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const v = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
    applyHsv(hsv.h, s, v);
  }

  function handleHexInput(raw: string) {
    const cleaned = raw.replace(/[^#0-9a-fA-F]/g, "").slice(0, 7);
    setEditingDraft(cleaned);
    const parsed = normalizeHex(cleaned);
    if (parsed && cleaned.replace(/^#/, "").length === 6) {
      const next = hexToHsv(parsed);
      if (next.s > 0 && next.v > 0) setSavedHue(next.h);
      onChange(parsed, true);
    }
  }

  function commitHexInput() {
    const parsed = normalizeHex(draft);
    setEditingDraft(null);
    if (parsed) {
      const next = hexToHsv(parsed);
      if (next.s > 0 && next.v > 0) setSavedHue(next.h);
      onChange(parsed, false);
      onCommit?.();
    }
  }

  const pureHue = hsvToHex(hsv.h, 1, 1);

  return (
    <div ref={rootRef} className="relative space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span className="font-mono text-[11px] text-muted-foreground">{normalized}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`${label} ${color}`}
            aria-pressed={normalized === color.toUpperCase()}
            onClick={() => {
              onChange(color.toUpperCase(), false);
              onCommit?.();
            }}
            className="size-7 rounded-full border-2 border-border aria-pressed:border-primary aria-pressed:ring-2 aria-pressed:ring-ring"
            style={{ backgroundColor: color }}
          />
        ))}
        <button
          type="button"
          aria-expanded={open}
          aria-label={`${label}: chọn màu tự do hoặc nhập mã HEX`}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-md border bg-card px-2 text-xs font-medium hover:bg-accent",
            open && "border-primary ring-2 ring-ring",
          )}
        >
          <span
            aria-hidden
            className="size-4 rounded-sm border border-black/15"
            style={{ backgroundColor: normalized }}
          />
          <Pipette aria-hidden className="size-3.5 text-muted-foreground" />
        </button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-label={`Chọn màu cho ${label}`}
          className="z-30 mt-2 w-full max-w-[260px] space-y-3 rounded-xl border bg-card p-3 shadow-lg"
        >
          {/* Ô kéo Sáng / Đậm */}
          <div
            ref={padRef}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              pickFromPad(event.clientX, event.clientY);
            }}
            onPointerMove={(event) => {
              if (event.buttons === 1) pickFromPad(event.clientX, event.clientY);
            }}
            onPointerUp={() => onCommit?.()}
            className="relative h-36 w-full cursor-crosshair touch-none overflow-hidden rounded-lg border"
            style={{
              backgroundColor: pureHue,
              backgroundImage:
                "linear-gradient(to top, #000000, transparent), linear-gradient(to right, #FFFFFF, transparent)",
            }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1.5px_rgba(0,0,0,0.45)]"
              style={{
                left: `${hsv.s * 100}%`,
                top: `${(1 - hsv.v) * 100}%`,
                backgroundColor: normalized,
              }}
            />
          </div>

          {/* Thanh trượt tông màu Hue */}
          <input
            type="range"
            aria-label="Tông màu"
            min={0}
            max={360}
            value={Math.round(hsv.h)}
            onChange={(event) => applyHsv(Number(event.target.value), hsv.s, hsv.v)}
            onPointerUp={() => onCommit?.()}
            className="h-3 w-full cursor-pointer appearance-none rounded-full"
            style={{
              background:
                "linear-gradient(to right, #FF0000, #FFFF00, #00FF00, #00FFFF, #0000FF, #FF00FF, #FF0000)",
            }}
          />

          {/* Ô nhập mã HEX duy nhất (#FFF hoặc #8E2424) */}
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-8 shrink-0 rounded-md border"
              style={{ backgroundColor: normalized }}
            />
            <label className="flex flex-1 items-center gap-1.5 rounded-md border bg-background px-2 py-1 text-xs">
              <span className="font-medium text-muted-foreground">HEX</span>
              <input
                type="text"
                aria-label="Mã màu HEX"
                spellCheck={false}
                autoCapitalize="characters"
                placeholder="#FFFFFF"
                value={draft}
                onChange={(event) => handleHexInput(event.target.value)}
                onBlur={commitHexInput}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commitHexInput();
                  }
                }}
                className="w-full bg-transparent font-mono text-xs uppercase outline-none"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
