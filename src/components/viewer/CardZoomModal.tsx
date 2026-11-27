"use client";

import { X, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LetterView } from "@/components/letter/LetterView";
import { cn } from "@/lib/utils";
import type { FaceId, PublicLetter } from "@/types/letter";

const FACE_LABELS: Record<FaceId, string> = {
  front: "Mặt trước",
  inside: "Mặt sau & QR",
};

function ModalBody({
  letter,
  qrUrl,
  initialFace,
  onClose,
}: {
  letter: PublicLetter;
  qrUrl: string;
  initialFace: FaceId;
  onClose: () => void;
}) {
  const [face, setFace] = useState<FaceId>(initialFace);
  const [zoomed, setZoomed] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Chuyển focus vào hộp thoại, khóa cuộn nền, giữ Tab bên trong và trả focus khi đóng.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled])");
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Xem phóng to tấm thiệp"
      className="fixed inset-0 z-50 flex flex-col overscroll-contain bg-black/85 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-2 pb-3 text-white">
        <div className="flex items-center gap-1.5 rounded-full bg-white/10 p-1">
          {(["front", "inside"] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setFace(id)}
              aria-pressed={face === id}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition sm:text-sm",
                face === id ? "bg-white text-[#2B2623]" : "text-white/85 hover:bg-white/10",
              )}
            >
              {FACE_LABELS[id]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoomed((z) => !z)}
            aria-label={zoomed ? "Thu về vừa màn hình" : "Phóng to thêm"}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/25 sm:text-sm"
          >
            {zoomed ? <ZoomOut className="size-4" /> : <ZoomIn className="size-4" />}
            {zoomed ? "Vừa khung" : "Phóng to"}
          </button>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Đóng xem phóng to"
            className="flex size-9 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center overflow-auto">
        <div
          className={cn(
            "transition-all duration-200 motion-reduce:transition-none",
            zoomed ? "w-[min(170vw,1200px)]" : "w-full max-w-3xl",
          )}
        >
          <div className="overflow-hidden rounded-xl border border-white/20 bg-white shadow-2xl">
            <LetterView face={letter.canvas_data.faces[face]} qrUrl={qrUrl} />
          </div>
        </div>
      </div>
      <p className="pt-2 text-center text-xs text-white/75">
        {zoomed
          ? "Kéo để xem chi tiết · Chạm nút Vừa khung hoặc nhấn Esc để đóng"
          : "Chạm “Phóng to” để soi rõ từng chi tiết nhỏ"}
      </p>
    </div>
  );
}

/** FR-16: phóng to tấm thiệp để người nhận đọc rõ chữ nhỏ trên điện thoại. */
export function CardZoomModal({
  letter,
  qrUrl,
  initialFace = "front",
  open,
  onClose,
}: {
  letter: PublicLetter;
  qrUrl: string;
  initialFace?: FaceId;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <ModalBody
      key={initialFace}
      letter={letter}
      qrUrl={qrUrl}
      initialFace={initialFace}
      onClose={onClose}
    />
  );
}
