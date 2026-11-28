"use client";

import { ZoomIn } from "lucide-react";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { LetterView } from "@/components/letter/LetterView";
import { letterUrl, previewQrUrl } from "@/lib/render/qr";
import { resolveWebStyle } from "@/lib/web-styles";
import { FACE_IDS, type FaceId, type PublicLetter, type WebStyleConfig } from "@/types/letter";
import { AcceptBlock, PollBlock, RsvpBlock } from "./blocks";
import { CardZoomModal } from "./CardZoomModal";
import { ScrollStory } from "./ScrollStory";

const noSubscribe = () => () => {};

/**
 * Nội dung sau khi mở phong bì:
 * - Nếu có `web_config.sections` (FR-10): hiện trang web cuộn dọc theo phong cách FR-15.
 * - Nếu chưa có `sections` (thư cũ): hiện 2 mặt thiệp (chạm để phóng to — FR-16) + các Block.
 */
export function LetterContent({
  letter,
  recipient,
  preview,
  styleOverride,
}: {
  letter: PublicLetter;
  recipient: string;
  preview?: boolean;
  styleOverride?: WebStyleConfig;
}) {
  const origin = useSyncExternalStore(
    noSubscribe,
    () => window.location.origin,
    () => "",
  );
  const [zoomFace, setZoomFace] = useState<FaceId | null>(null);
  const qrUrl = preview ? previewQrUrl(origin) : letterUrl(origin, letter.slug);

  if (letter.web_config.sections && letter.web_config.sections.length > 0) {
    const resolvedStyle = resolveWebStyle(styleOverride ?? letter.web_config.style);
    return (
      <ScrollStory
        letter={letter}
        recipient={recipient}
        qrUrl={qrUrl}
        resolvedStyle={resolvedStyle}
        preview={preview}
      />
    );
  }

  const { blocks, senderName } = letter.web_config;
  const name = recipient || letter.web_config.recipientName;
  const shared = { slug: letter.slug, recipient: name, preview };

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6">
      {name && <h1 className="text-center font-playfair text-2xl text-primary">Gửi {name}</h1>}
      {FACE_IDS.map((id) => {
        const face = letter.canvas_data.faces[id];
        const texts = face.elements.flatMap((el) => (el.type === "text" ? [el.text] : []));
        return (
          <button
            key={id}
            type="button"
            onClick={() => setZoomFace(id)}
            aria-label={`Phóng to ${id === "front" ? letter.title || "mặt trước thiệp" : "mặt sau thiệp"}. ${texts.join(". ")}`}
            className="group relative overflow-hidden rounded-lg border text-left shadow-sm focus-visible:ring-2 focus-visible:ring-ring"
          >
            <LetterView face={face} qrUrl={qrUrl} />
            <span
              aria-hidden
              className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white opacity-90 transition group-hover:bg-black/75"
            >
              <ZoomIn className="size-3.5" /> Chạm để phóng to
            </span>
          </button>
        );
      })}
      {senderName && <p className="text-right font-dancing text-2xl">Từ {senderName}</p>}

      {blocks.acceptButton?.enabled && <AcceptBlock {...shared} block={blocks.acceptButton} />}
      {blocks.rsvp?.enabled && <RsvpBlock {...shared} block={blocks.rsvp} />}
      {blocks.poll?.enabled && <PollBlock {...shared} block={blocks.poll} />}

      <footer className="border-t pt-4 text-center text-sm text-muted-foreground">
        Tạo bằng Thư Nhỏ.{" "}
        <Link href="/" className="font-medium text-primary underline underline-offset-4">
          Làm một lá thư miễn phí
        </Link>
      </footer>

      <CardZoomModal
        letter={letter}
        qrUrl={qrUrl}
        initialFace={zoomFace ?? "front"}
        open={zoomFace !== null}
        onClose={() => setZoomFace(null)}
      />
    </main>
  );
}
