"use client";

import { ImagePlus } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { currentElements, useEditorStore } from "@/lib/editor/store";
import { PRINT_CONFIG } from "@/lib/print-config";
import { LIMITS } from "@/lib/validation";
import type { ImageFilter, ImageFrame } from "@/types/letter";
import { Choice, Section } from "./ui";
import { useImageUpload } from "./useImageUpload";

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
        </>
      )}
    </Section>
  );
}
