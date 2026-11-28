"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/editor/store";
import type { ImageFit, ImageFrame, WebImage } from "@/types/letter";
import { FocusPicker } from "../FocusPicker";
import { Choice, Slider } from "../ui";
import { useImageUpload } from "../useImageUpload";

const FITS: { value: ImageFit; label: string }[] = [
  { value: "contain", label: "Hiện trọn ảnh" },
  { value: "cover", label: "Phủ kín khung" },
];

const WEB_FRAMES: { value: ImageFrame; label: string }[] = [
  { value: "none", label: "Mặc định" },
  { value: "rounded", label: "Bo góc" },
  { value: "circle", label: "Tròn" },
  { value: "heart", label: "Trái tim" },
  { value: "arch", label: "Vòm cửa" },
  { value: "star", label: "Ngôi sao" },
  { value: "polaroid", label: "Polaroid" },
  { value: "tape", label: "Băng dính" },
  { value: "film", label: "Dải phim" },
];

/**
 * Ảnh trong một phần của trang web (FR-10, FR-16): tải lên (hạn mức 8, riêng với ảnh thiệp),
 * chọn cách hiện và điểm giữ khi cắt.
 * `onChange` phải đọc trạng thái mới nhất của store, vì tải ảnh xong sau vài giây.
 */
export function WebImageField({
  label,
  image,
  defaultFit = "contain",
  focusKey,
  onChange,
}: {
  label: string;
  image: WebImage | undefined;
  defaultFit?: ImageFit;
  /** Khóa gộp Undo khi kéo điểm giữ. */
  focusKey: string;
  onChange: (image: WebImage | undefined, coalesceKey?: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const { upload, busy, error, used, max, full } = useImageUpload("web");
  const endCoalesce = useEditorStore((s) => s.endCoalesce);
  const fit = image?.fit ?? defaultFit;

  return (
    <div className="space-y-2">
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          void upload(file, ({ url }) => onChange({ src: url }));
        }}
      />
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {image && (
        <>
          <FocusPicker
            src={image.src}
            value={image.focus ?? { x: 0.5, y: 0.5 }}
            onChange={(focus) => onChange({ ...image, focus }, focusKey)}
            onCommit={endCoalesce}
          />
          <Choice options={FITS} value={fit} onChange={(next) => onChange({ ...image, fit: next })} />
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Khung cắt ảnh</p>
            <Choice
              options={WEB_FRAMES}
              value={image.frame ?? "none"}
              onChange={(frame) =>
                onChange({ ...image, frame: frame === "none" ? undefined : frame })
              }
            />
          </div>
          <Slider
            label="Cỡ ảnh"
            min={40}
            max={100}
            step={5}
            value={image.size ?? 100}
            format={(v) => `${v}%`}
            onChange={(size) => onChange({ ...image, size }, `${focusKey}:size`)}
            onCommit={endCoalesce}
          />
          <Slider
            label="Phóng to trong khung"
            min={1}
            max={3}
            step={0.1}
            value={image.zoom ?? 1}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(zoom) =>
              onChange({ ...image, zoom: Math.round(zoom * 10) / 10 }, `${focusKey}:zoom`)
            }
            onCommit={endCoalesce}
          />
          {fit === "contain" && (image.zoom ?? 1) === 1 && (
            <p className="text-xs text-muted-foreground">
              Điểm giữ có tác dụng khi chọn “Phủ kín khung” hoặc khi phóng to.
            </p>
          )}
        </>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          // Thay ảnh không làm tăng số ảnh nên vẫn được khi đã đầy.
          disabled={busy || (full && !image)}
          onClick={() => input.current?.click()}
        >
          <ImagePlus /> {busy ? "Đang tải ảnh..." : image ? "Đổi ảnh" : "Thêm ảnh"}
        </Button>
        {image && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(undefined)}>
            <Trash2 /> Bỏ ảnh
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Trang web đã dùng {used}/{max} ảnh.
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
