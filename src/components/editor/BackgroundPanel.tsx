"use client";

import { ImagePlus, Sparkles } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { currentBackground, useEditorStore } from "@/lib/editor/store";
import { PRESET_STYLES, presetSwatchStyle } from "@/lib/render/presets";
import { KIT_PALETTES } from "@/lib/theme-sync";
import { cn } from "@/lib/utils";
import { BACKGROUND_PRESETS, type BackgroundConfig } from "@/types/letter";
import { ColorField } from "./ColorField";
import { Choice, Section, Slider, Toggle } from "./ui";
import { useImageUpload } from "./useImageUpload";

const DEFAULT_PHOTO_OVERLAY = 0.35;
const PASTELS = ["#F9F6F1", "#FDE2E4", "#FFF1C9", "#DDEBD8", "#DCE8F5", "#E9DFF2"];

const MODES: { value: BackgroundConfig["type"]; label: string }[] = [
  { value: "preset", label: "Mẫu giấy" },
  { value: "color", label: "Màu trơn" },
  { value: "image", label: "Ảnh của bạn" },
];

/** Panel nền 3 lớp: mẫu giấy, màu tự chọn, ảnh nền kèm lớp phủ và làm mờ. */
export function BackgroundPanel() {
  const background = useEditorStore(currentBackground);
  const onBoard = useEditorStore((s) => s.boardId !== null);
  const hideForPrint = useEditorStore((s) => s.printHideBackground);
  const setHideForPrint = useEditorStore((s) => s.setPrintHideBackground);
  const setBackground = useEditorStore((s) => s.setBackground);
  const syncCardAndEnvelopeTheme = useEditorStore((s) => s.syncCardAndEnvelopeTheme);
  const applyKitPalette = useEditorStore((s) => s.applyKitPalette);
  const endCoalesce = useEditorStore((s) => s.endCoalesce);
  const input = useRef<HTMLInputElement>(null);
  const { upload, busy, error, full } = useImageUpload();

  const isPhoto = background.type === "image";
  // Đổi ảnh nền không làm tăng số ảnh, nên chỉ chặn khi chưa có ảnh nền.
  const blocked = full && !isPhoto;

  function switchMode(mode: BackgroundConfig["type"]) {
    if (mode === background.type) return;
    // Chưa có ảnh thì giữ nền cũ cho tới khi tải ảnh lên xong.
    if (mode === "image") {
      if (!blocked) input.current?.click();
      return;
    }
    setBackground({
      type: mode,
      value: mode === "preset" ? "cream" : PASTELS[0],
      overlayOpacity: 0,
      blur: 0,
    });
  }

  return (
    <Section title="Nền thiệp">
      <Choice options={MODES} value={background.type} onChange={switchMode} />

      {background.type === "preset" && (
        <div className="grid grid-cols-2 gap-2">
          {BACKGROUND_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              aria-pressed={background.value === preset}
              onClick={() => setBackground({ value: preset })}
              className={cn(
                "rounded-md border bg-card p-2 text-left text-xs font-medium hover:bg-accent",
                background.value === preset && "border-primary ring-2 ring-ring",
              )}
            >
              <span
                className="mb-1.5 block h-9 rounded border border-black/10"
                style={presetSwatchStyle(preset)}
              />
              {PRESET_STYLES[preset].label}
            </button>
          ))}
        </div>
      )}

      {background.type === "color" && (
        <ColorField
          label="Màu nền"
          colors={PASTELS}
          value={background.value}
          onChange={(value, custom) => setBackground({ value }, custom ? "bg-color" : undefined)}
          onCommit={endCoalesce}
        />
      )}

      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          void upload(file, ({ url }) => {
            const state = useEditorStore.getState();
            const current = state.doc.canvas_data.faces[state.face].background;
            const keep = current.type === "image";
            setBackground({
              type: "image",
              value: url,
              overlayOpacity: keep ? current.overlayOpacity : DEFAULT_PHOTO_OVERLAY,
              blur: keep ? (current.blur ?? 0) : 0,
            });
          });
        }}
      />
      {busy && <p className="text-sm text-muted-foreground">Đang tải ảnh...</p>}
      {blocked && (
        <p className="text-xs text-muted-foreground">
          Đã đủ 4 ảnh. Hãy xóa bớt ảnh nếu muốn dùng ảnh nền.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {isPhoto && (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => input.current?.click()}
          >
            <ImagePlus /> Đổi ảnh nền
          </Button>
          <Slider
            label="Phủ dịu"
            min={0}
            max={0.8}
            step={0.05}
            value={background.overlayOpacity}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(overlayOpacity) => setBackground({ overlayOpacity }, "bg-overlay")}
            onCommit={endCoalesce}
          />
          <Slider
            label="Làm mờ"
            min={0}
            max={10}
            step={1}
            value={background.blur ?? 0}
            format={(v) => `${v}px`}
            onChange={(blur) => setBackground({ blur }, "bg-blur")}
            onCommit={endCoalesce}
          />
        </>
      )}

      {!onBoard && (
        <>
          <div className="space-y-2 border-t pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => syncCardAndEnvelopeTheme()}
            >
              <Sparkles className="size-3.5" /> Đồng bộ màu cho cả Thiệp &amp; Phong bì
            </Button>
            <p className="text-xs font-medium text-muted-foreground">
              Hoặc chọn bộ phối màu 1 chạm (Thiệp + Phong bì + Web)
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {KIT_PALETTES.map((palette) => (
                <button
                  key={palette.id}
                  type="button"
                  onClick={() => applyKitPalette(palette)}
                  className="flex items-center gap-2 rounded-md border bg-card px-2 py-1.5 text-left text-xs hover:border-primary hover:bg-accent"
                >
                  <span className="flex shrink-0 -space-x-1">
                    <span
                      aria-hidden
                      className="size-3.5 rounded-full border border-black/15"
                      style={{ backgroundColor: palette.swatches[0] }}
                    />
                    <span
                      aria-hidden
                      className="size-3.5 rounded-full border border-black/15"
                      style={{ backgroundColor: palette.swatches[1] }}
                    />
                  </span>
                  <span className="truncate">{palette.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Toggle
            label="Ẩn nền khi in (giấy Kraft hoặc giấy màu)"
            checked={hideForPrint}
            onChange={setHideForPrint}
          />
        </>
      )}
    </Section>
  );
}
