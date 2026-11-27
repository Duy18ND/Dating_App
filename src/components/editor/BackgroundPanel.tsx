"use client";

import { ImagePlus } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/editor/store";
import { PRESET_STYLES } from "@/lib/render/presets";
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
  const background = useEditorStore((s) => s.doc.canvas_data.background);
  const hideForPrint = useEditorStore((s) => s.printHideBackground);
  const setHideForPrint = useEditorStore((s) => s.setPrintHideBackground);
  const setBackground = useEditorStore((s) => s.setBackground);
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
                "rounded-md border bg-card p-2 text-left text-sm hover:bg-accent",
                background.value === preset && "border-primary ring-2 ring-ring",
              )}
            >
              <span
                className="mb-1 block h-10 rounded border"
                style={{ backgroundColor: PRESET_STYLES[preset].base }}
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
            const current = useEditorStore.getState().doc.canvas_data.background;
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

      <Toggle
        label="Ẩn nền khi in (giấy Kraft hoặc giấy màu)"
        checked={hideForPrint}
        onChange={setHideForPrint}
      />
    </Section>
  );
}
