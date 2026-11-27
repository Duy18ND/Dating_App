"use client";

import { X, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useState } from "react";
import { LetterView } from "@/components/letter/LetterView";
import { cn } from "@/lib/utils";
import type { FaceId, PublicLetter } from "@/types/letter";

const FACE_LABELS: Record<FaceId, string> = {
  front: "Bìa trước",
  inside: "Mặt trong & QR",
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

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Xem phóng to tấm thiệp"
      className="fixed inset-0 z-50 flex flex-col bg-black/80 p-3 backdrop-blur-sm sm:p-6"
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
