"use client";

import { useEffect, useState } from "react";
import { isBridgeMessage, type FromPreview, type ToPreview } from "@/lib/preview-bridge";
import { LetterExperience } from "./LetterExperience";

/** Phía trong iframe: vẽ bản nháp bằng đúng thành phần của trang người nhận. */
export function DraftPreview() {
  const [message, setMessage] = useState<ToPreview>();

  useEffect(() => {
    const parent = window.parent === window ? null : window.parent;
    const origin = window.location.origin;
    const receive = (event: MessageEvent) => {
      if (event.origin !== origin) return;
      if (isBridgeMessage(event, { origin, source: parent, tag: "pls-editor" })) {
        setMessage(event.data as ToPreview);
      }
    };
    window.addEventListener("message", receive);
    const ready: FromPreview = { source: "pls-preview", type: "ready" };
    parent?.postMessage(ready, origin);
    // Link trong bản xem trước (VD "Làm một lá thư miễn phí") không được rời trang nháp.
    const stayHere = (event: MouseEvent) => {
      if ((event.target as Element).closest?.("a")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener("click", stayHere, true);
    return () => {
      window.removeEventListener("message", receive);
      document.removeEventListener("click", stayHere, true);
    };
  }, []);

  const focusId = message?.focusId;
  useEffect(() => {
    if (!focusId) return;
    // Chờ một nhịp để phần vừa bật hoặc vừa thêm đã được dựng.
    const timer = window.setTimeout(() => {
      document
        .querySelector(`[data-section-id="${CSS.escape(focusId)}"]`)
        ?.scrollIntoView({ block: "start", behavior: "smooth" });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [focusId]);

  if (!message) {
    return <p className="p-8 text-center text-sm text-muted-foreground">Đang chờ trình thiết kế...</p>;
  }
  return (
    <LetterExperience
      key={message.replay}
      letter={message.letter}
      recipient=""
      preview
      initialStep={message.replay === 0 ? "open" : "sealed"}
    />
  );
}
