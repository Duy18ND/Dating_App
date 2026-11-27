"use client";

import { useMemo } from "react";
import { LetterView } from "@/components/letter/LetterView";
import { previewQrUrl } from "@/lib/render/qr";
import { createFromTemplate } from "@/lib/templates";
import type { FaceId, TemplateType } from "@/types/letter";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Ảnh xem trước vẽ trực tiếp từ JSON của mẫu nên luôn khớp với nội dung thật. */
export function TemplatePreview({ type, face = "front" }: { type: TemplateType; face?: FaceId }) {
  const card = useMemo(() => createFromTemplate(type).canvas_data.faces[face], [type, face]);
  return (
    <div className="pointer-events-none overflow-hidden rounded-md border" aria-hidden>
      <LetterView face={card} qrUrl={previewQrUrl(SITE_URL)} />
    </div>
  );
}
