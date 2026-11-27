"use client";

import { useState } from "react";
import { uploadImage } from "@/lib/client/api";
import { compressToWebp } from "@/lib/client/compress-image";
import { useEditorStore } from "@/lib/editor/store";
import { collectUserImageUrls, collectWebImageUrls, LIMITS } from "@/lib/validation";

/**
 * Tải ảnh lên R2 (nén WebP trước). Hai hạn mức tính riêng (v1.2):
 * - `card`: ảnh trên 2 mặt thiệp, tối đa `LIMITS.maxUserImages`.
 * - `web`: ảnh trong các phần trang web cuộn, tối đa `LIMITS.maxWebImages`.
 */
export function useImageUpload(fixed?: "card" | "web") {
  // Không chỉ định thì theo nơi đang vẽ: khung tự do tính vào ảnh trang web.
  const onBoard = useEditorStore((s) => s.boardId !== null);
  const scope = fixed ?? (onBoard ? "web" : "card");
  const canvas = useEditorStore((s) => s.doc.canvas_data);
  const web = useEditorStore((s) => s.doc.web_config);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const used = scope === "web" ? collectWebImageUrls(web).length : collectUserImageUrls(canvas).length;
  const max = scope === "web" ? LIMITS.maxWebImages : LIMITS.maxUserImages;

  async function upload(
    file: File | undefined,
    onDone: (image: { url: string; width: number; height: number }) => void,
  ) {
    if (!file || busy) return;
    setBusy(true);
    setError(undefined);
    try {
      const { blob, width, height } = await compressToWebp(file);
      onDone({ url: await uploadImage(blob), width, height });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Tải ảnh thất bại");
    } finally {
      setBusy(false);
    }
  }

  return { upload, busy, error, used, max, scope, full: used >= max };
}
