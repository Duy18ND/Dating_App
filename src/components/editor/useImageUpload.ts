"use client";

import { useState } from "react";
import { uploadImage } from "@/lib/client/api";
import { compressToWebp } from "@/lib/client/compress-image";
import { useEditorStore } from "@/lib/editor/store";
import { collectUserImageUrls, collectWebImageUrls, LIMITS } from "@/lib/validation";

export interface UploadedImage {
  url: string;
  width: number;
  height: number;
}

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
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string>();
  const used = scope === "web" ? collectWebImageUrls(web).length : collectUserImageUrls(canvas).length;
  const max = scope === "web" ? LIMITS.maxWebImages : LIMITS.maxUserImages;

  async function upload(file: File | undefined, onDone: (image: UploadedImage) => void) {
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

  /** Tải nhiều ảnh cùng lúc trong 1 lần chọn, tự giới hạn theo chỗ trống còn lại. */
  async function uploadMany(
    fileList: FileList | File[] | null | undefined,
    maxCount: number,
    onDone: (images: UploadedImage[]) => void,
  ) {
    if (!fileList || busy) return;
    const all = Array.from(fileList);
    if (all.length === 0) return;

    const latestState = useEditorStore.getState();
    const currentUsed =
      scope === "web"
        ? collectWebImageUrls(latestState.doc.web_config).length
        : collectUserImageUrls(latestState.doc.canvas_data).length;
    const remaining = Math.max(0, Math.min(max - currentUsed, maxCount));
    if (remaining === 0) {
      setError(`Đã đạt giới hạn ảnh cho mục này (tối đa ${max} ảnh trên trang web).`);
      return;
    }

    const picked = all.slice(0, remaining);
    const truncated = all.length > picked.length;
    setBusy(true);
    setError(undefined);
    setProgress({ done: 0, total: picked.length });

    const uploaded: UploadedImage[] = [];
    let firstError: string | undefined;
    try {
      for (let i = 0; i < picked.length; i++) {
        try {
          const { blob, width, height } = await compressToWebp(picked[i]);
          uploaded.push({ url: await uploadImage(blob), width, height });
        } catch (cause) {
          if (!firstError) {
            firstError = cause instanceof Error ? cause.message : "Một số ảnh tải lên thất bại";
          }
        }
        setProgress({ done: i + 1, total: picked.length });
      }
      if (uploaded.length > 0) onDone(uploaded);
      if (firstError) {
        setError(firstError);
      } else if (truncated) {
        setError(`Chỉ tải ${picked.length}/${all.length} ảnh đầu tiên do chạm giới hạn ảnh.`);
      }
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return { upload, uploadMany, busy, progress, error, used, max, scope, full: used >= max };
}
