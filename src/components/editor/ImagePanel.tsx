"use client";

import { ImagePlus } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { currentElements, currentHeight, useEditorStore } from "@/lib/editor/store";
import { PRINT_CONFIG } from "@/lib/print-config";
import { defaultImageBorder } from "@/lib/render/image-frame";
import type { ImageFilter, ImageFrame } from "@/types/letter";
import { ColorField } from "./ColorField";
import { FocusPicker } from "./FocusPicker";
import { Choice, Section } from "./ui";
import { useImageUpload } from "./useImageUpload";

const BORDER_COLORS = ["#FFFFFF", "#F9F6F1", "#F2D7D5", "#E8C36B", "#8E2424", "#2B2623"];

const BORDER_PRESETS = [
  { label: "Tắt", value: 0 },
  { label: "Mảnh", value: 10 },
  { label: "Vừa", value: 18 },
  { label: "Dày", value: 32 },
] as const;

const FRAMES: { value: ImageFrame; label: string }[] = [
  { value: "none", label: "Gốc" },
  { value: "rounded", label: "Bo góc" },
  { value: "circle", label: "Tròn" },
  { value: "heart", label: "Trái tim" },
  { value: "arch", label: "Vòm cửa" },
  { value: "star", label: "Ngôi sao" },
  { value: "scallop", label: "Hoa lượn" },
  { value: "cloud", label: "Đám mây" },
  { value: "polaroid", label: "Polaroid" },
  { value: "tape", label: "Băng dính" },
  { value: "stamp", label: "Tem răng cưa" },
  { value: "film", label: "Dải phim" },
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
  const { upload, busy, error, used, max, full, scope } = useImageUpload();
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
              y: Math.round((currentHeight(useEditorStore.getState()) - height * scale) / 2),
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
        {scope === "web" ? "Trang web" : "Thiệp"} đã dùng {used}/{max} ảnh (tính cả ảnh nền).
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
          {selected.frame !== "polaroid" &&
            selected.frame !== "stamp" &&
            selected.frame !== "film" &&
            selected.frame !== "tape" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <label htmlFor="img-border-width" className="font-medium">
                    Độ dày viền khung
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
          <ColorField
            label="Màu viền khung"
            colors={BORDER_COLORS}
            value={selected.borderColor ?? (selected.frame === "film" ? "#1E1B1A" : "#FFFFFF")}
            onChange={(borderColor, custom) =>
              update(selected.id, { borderColor }, custom ? `border-color:${selected.id}` : undefined)
            }
            onCommit={endCoalesce}
          />
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
