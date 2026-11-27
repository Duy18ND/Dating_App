"use client";

import { LetterView } from "@/components/letter/LetterView";
import type { BoardSection } from "@/types/letter";

/**
 * Khung tự do trên trang người nhận: cả khung phóng/thu theo bề rộng màn hình nên bố cục
 * giống nhau trên mọi máy (FR-16). Chữ nằm trong canvas nên được lặp lại cho trình đọc
 * màn hình. Không nhận chạm, để vuốt qua khung vẫn cuộn trang bình thường.
 */
export function StoryBoard({ section }: { section: BoardSection }) {
  const texts = section.elements.flatMap((el) =>
    el.type === "text" && el.text?.trim() ? [el.text.trim()] : [],
  );
  return (
    <figure className="overflow-hidden rounded-2xl shadow-sm">
      <div aria-hidden className="pointer-events-none">
        <LetterView face={section} height={section.height} qrUrl="" listening={false} />
      </div>
      <figcaption className="sr-only">{texts.join(". ") || "Khung trang trí"}</figcaption>
    </figure>
  );
}
