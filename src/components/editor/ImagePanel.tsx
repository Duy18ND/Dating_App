"use client";

import { ImagePlus } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { currentElements, useEditorStore } from "@/lib/editor/store";
import { PRINT_CONFIG } from "@/lib/print-config";
import { defaultImageBorder } from "@/lib/render/image-frame";
import { LIMITS } from "@/lib/validation";
import type { ImageFilter, ImageFocus, ImageFrame } from "@/types/letter";
import { Choice, Section } from "./ui";
import { useImageUpload } from "./useImageUpload";

const BORDER_PRESETS = [
  { label: "Tắt", value: 0 },
  { label: "Mảnh", value: 10 },
  { label: "Vừa", value: 18 },
  { label: "Dày", value: 32 },
] as const;

const FOCUS_PRESETS: { label: string; focus: ImageFocus }[] = [
  { label: "Trên", focus: { x: 0.5, y: 0.15 } },
  { label: "Giữa", focus: { x: 0.5, y: 0.5 } },
  { label: "Dưới", focus: { x: 0.5, y: 0.85 } },
  { label: "Trái", focus: { x: 0.15, y: 0.5 } },
  { label: "Phải", focus: { x: 0.85, y: 0.5 } },
];

const clamp01 = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 100) / 100;

function FocusPicker({
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

const FRAMES: { value: ImageFrame; label: string }[] = [
  { value: "none", label: "Gốc" },
  { value: "polaroid", label: "Polaroid" },
  { value: "stamp", label: "Tem răng cưa" },
  { value: "rounded", label: "Bo góc" },
  { value: "circle", label: "Tròn" },
  { value: "cloud", label: "Đám mây" },
];
const FILTERS: { value: ImageFilter; label: string }[] = [
  { value: "none", label: "Gốc" },
  { value: "vintage", label: "Vintage" },
  { value: "bw", label: "Đen trắng" },
];
const INITIAL_SIZE = 600;

/** Chọn ảnh, nén WebP, tải lên R2 rồi thêm vào canvas (tối đa 4 ảnh mỗi thư, tính cả ảnh nền). */
export function ImagePanel() {
  const input = useRef<HTMLInputElement>(null);
  const { upload, busy, error, used, full } = useImageUpload();
  const addElement = useEditorStore((s) => s.addElement);
  const update = useEditorStore((s) => s.updateElement);
  const endCoalesce = useEditorStore((s) => s.endCoalesce);
  const selected = useEditorStore((s) =>
    currentElements(s).find((el) => el.id === s.selectedId && el.type === "image"),
  );

  return (
    <Section title="Ảnh cá nhân">
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          // Cho phép chọn lại đúng file vừa chọn.
          event.target.value = "";
          void upload(file, ({ url, width, height }) => {
            // Cạnh dài bằng INITIAL_SIZE để ảnh dọc không tràn khỏi canvas.
            const scale = INITIAL_SIZE / Math.max(width, height);
            const w = Math.round(width * scale);
            addElement({
              type: "image",
              x: Math.round((PRINT_CONFIG.CANVAS.width - w) / 2),
              y: Math.round((PRINT_CONFIG.CANVAS.height - height * scale) / 2),
              width: w,
              height: Math.round(height * scale),
              src: url,
              frame: "none",
              filter: "none",
            });
          });
        }}
      />
      <Button
        type="button"
        variant="outline"
        disabled={busy || full}
        onClick={() => input.current?.click()}
      >
        <ImagePlus /> {busy ? "Đang tải ảnh..." : "Thêm ảnh"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Đã dùng {used}/{LIMITS.maxUserImages} ảnh (tính cả ảnh nền).
        {full && " Hãy xóa bớt để thêm ảnh mới."}
        <br />
        Bạn tự chịu trách nhiệm với ảnh mình tải lên.
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {selected && (
        <>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Khung ảnh</p>
            <Choice
              options={FRAMES}
              value={selected.frame ?? "none"}
              onChange={(frame) => update(selected.id, { frame })}
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Bộ lọc màu</p>
            <Choice
              options={FILTERS}
              value={selected.filter ?? "none"}
              onChange={(filter) => update(selected.id, { filter })}
            />
          </div>
          {selected.frame !== "polaroid" && selected.frame !== "stamp" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <label htmlFor="img-border-width" className="font-medium">
                  Độ dày viền trắng
                </label>
                <span>
                  {selected.borderWidth ??
                    defaultImageBorder(selected.width ?? 600, selected.height ?? 600)}{" "}
                  px
                </span>
              </div>
              <input
                id="img-border-width"
                type="range"
                min={0}
                max={48}
                step={2}
                value={
                  selected.borderWidth ??
                  defaultImageBorder(selected.width ?? 600, selected.height ?? 600)
                }
                onChange={(event) =>
                  update(
                    selected.id,
                    { borderWidth: Number(event.target.value) },
                    `border:${selected.id}`,
                  )
                }
                onPointerUp={endCoalesce}
                onBlur={endCoalesce}
                className="w-full accent-primary"
              />
              <div className="flex flex-wrap gap-1.5">
                {BORDER_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      update(selected.id, { borderWidth: preset.value });
                      endCoalesce();
                    }}
                    className="rounded border bg-card px-2 py-1 text-xs hover:bg-accent"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {selected.src && (
            <FocusPicker
              src={selected.src}
              value={selected.focus ?? { x: 0.5, y: 0.5 }}
              onChange={(focus) => update(selected.id, { focus }, `focus:${selected.id}`)}
              onCommit={endCoalesce}
            />
          )}
        </>
      )}
    </Section>
  );
}
