"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { LetterView } from "@/components/letter/LetterView";
import { letterUrl } from "@/lib/render/qr";
import type { PublicLetter } from "@/types/letter";
import { AcceptBlock, PollBlock, RsvpBlock } from "./blocks";

const noSubscribe = () => () => {};

/**
 * Tờ thư và các khối tương tác, không gồm phong bì.
 * T-20 bọc thành phần này sau hiệu ứng bóc dấu sáp (nhạc và recordView gọi ở đó).
 */
export function LetterContent({ letter, recipient }: { letter: PublicLetter; recipient: string }) {
  const origin = useSyncExternalStore(
    noSubscribe,
    () => window.location.origin,
    () => "",
  );
  const { blocks, senderName } = letter.web_config;
  const name = recipient || letter.web_config.recipientName;
  const shared = { slug: letter.slug, recipient: name };

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6">
      {name && <h1 className="text-center font-playfair text-2xl text-primary">Gửi {name}</h1>}
      <div
        role="img"
        aria-label={[
          letter.title,
          ...letter.canvas_data.elements.flatMap((el) => (el.type === "text" ? [el.text] : [])),
        ].join(". ")}
        className="overflow-hidden rounded-lg border shadow-sm"
      >
        <LetterView canvas={letter.canvas_data} qrUrl={letterUrl(origin, letter.slug)} />
      </div>
      {senderName && <p className="text-right font-dancing text-2xl">Từ {senderName}</p>}

      {blocks.acceptButton?.enabled && <AcceptBlock {...shared} block={blocks.acceptButton} />}
      {blocks.rsvp?.enabled && <RsvpBlock {...shared} block={blocks.rsvp} />}
      {blocks.poll?.enabled && <PollBlock {...shared} block={blocks.poll} />}

      <footer className="border-t pt-4 text-center text-sm text-muted-foreground">
        Tạo bằng Phygital Letter Studio.{" "}
        <Link href="/" className="font-medium text-primary underline underline-offset-4">
          Làm một lá thư miễn phí
        </Link>
      </footer>
    </main>
  );
}
