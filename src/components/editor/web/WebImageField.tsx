"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/editor/store";
import type { ImageFit, WebImage } from "@/types/letter";
import { FocusPicker } from "../FocusPicker";
import { Choice } from "../ui";
import { useImageUpload } from "../useImageUpload";

const FITS: { value: ImageFit; label: string }[] = [
  { value: "contain", label: "Hiện trọn ảnh" },
  { value: "cover", label: "Phủ kín khung" },
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
          {fit === "contain" && (
            <p className="text-xs text-muted-foreground">
              Điểm giữ chỉ có tác dụng khi chọn “Phủ kín khung”.
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
