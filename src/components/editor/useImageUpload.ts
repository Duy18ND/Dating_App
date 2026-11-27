"use client";

import { useState } from "react";
import { uploadImage } from "@/lib/client/api";
import { compressToWebp } from "@/lib/client/compress-image";
import { useEditorStore } from "@/lib/editor/store";
import { collectUserImageUrls, LIMITS } from "@/lib/validation";

export function useImageUpload() {
  const canvas = useEditorStore((s) => s.doc.canvas_data);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const used = collectUserImageUrls(canvas).length;

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

  return { upload, busy, error, used, full: used >= LIMITS.maxUserImages };
}
