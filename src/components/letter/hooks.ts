"use client";

import { useEffect, useState } from "react";
import { LETTER_FONTS } from "@/lib/fonts";
import type { FontName } from "@/lib/font-names";

export function useImage(src: string | undefined): HTMLImageElement | null {
  const [loaded, setLoaded] = useState<{ src: string; image: HTMLImageElement } | null>(null);
  useEffect(() => {
    if (!src) return;
    let active = true;
    const image = new Image();
    // Bắt buộc để stage.toDataURL() không bị "tainted" khi xuất PDF. R2 phải bật CORS.
    image.crossOrigin = "anonymous";
    image.onload = () => active && setLoaded({ src, image });
    image.src = src;
    return () => {
      active = false;
    };
  }, [src]);
  return loaded && loaded.src === src ? loaded.image : null;
}

export const fontFamilyOf = (name: FontName | undefined) =>
  LETTER_FONTS[name ?? "Be Vietnam Pro"].style.fontFamily;

/**
 * Canvas không tự vẽ lại khi web font tải xong. Hook trả về chuỗi thay đổi sau khi tải,
 * dùng làm key để Konva đo và vẽ lại chữ.
 */
export function useFontsKey(names: FontName[], sample: string): string {
  const request = [...new Set(names)].sort().join("|");
  const [ready, setReady] = useState("");
  useEffect(() => {
    let active = true;
    const loads = request
      .split("|")
      .filter(Boolean)
      .map((name) => document.fonts.load(`48px ${fontFamilyOf(name as FontName)}`, sample));
    Promise.allSettled(loads).then(() => active && setReady(`${request}:${sample.length}`));
    return () => {
      active = false;
    };
  }, [request, sample]);
  return ready;
}
