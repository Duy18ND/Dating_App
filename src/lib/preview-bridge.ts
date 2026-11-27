import type { PublicLetter } from "@/types/letter";

// Giao tiếp giữa trình soạn và iframe xem trước (/editor/xem-truoc). iframe cho viewport thật
// nên breakpoint, dvh, safe-area chạy đúng như trên điện thoại hay PC (FR-16).

export const PREVIEW_PATH = "/editor/xem-truoc";

export type ToPreview = {
  source: "pls-editor";
  letter: PublicLetter;
  /** Phần đang sửa: iframe cuộn tới đó khi giá trị đổi. */
  focusId: string | null;
  /** 0: hiện luôn trang đã mở. Tăng lên: đóng phong bì lại để xem cách mở thư. */
  replay: number;
};

export type FromPreview = { source: "pls-preview"; type: "ready" };

/** Chỉ nhận tin cùng origin, từ đúng cửa sổ mong đợi. */
export function isBridgeMessage(
  event: { origin: string; source: unknown; data: unknown },
  expected: { origin: string; source: unknown; tag: (ToPreview | FromPreview)["source"] },
): boolean {
  return (
    event.origin === expected.origin &&
    !!expected.source &&
    event.source === expected.source &&
    (event.data as { source?: unknown } | null)?.source === expected.tag
  );
}
