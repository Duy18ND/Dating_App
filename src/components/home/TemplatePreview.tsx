"use client";

import { useMemo } from "react";
import { LetterView } from "@/components/letter/LetterView";
import { previewQrUrl } from "@/lib/render/qr";
import { createFromTemplate } from "@/lib/templates";
import type { TemplateType } from "@/types/letter";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Ảnh xem trước vẽ trực tiếp từ JSON của mẫu nên luôn khớp với nội dung thật. */
export function TemplatePreview({ type }: { type: TemplateType }) {
  const canvas = useMemo(() => createFromTemplate(type).canvas_data, [type]);
  return (
    <div className="pointer-events-none overflow-hidden rounded-md border" aria-hidden>
      <LetterView canvas={canvas} qrUrl={previewQrUrl(SITE_URL)} />
    </div>
  );
}
