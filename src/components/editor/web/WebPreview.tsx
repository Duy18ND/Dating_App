"use client";

import { MailOpen, Monitor, Smartphone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/editor/store";
import { isBridgeMessage, PREVIEW_PATH, type ToPreview } from "@/lib/preview-bridge";

const DEVICES = {
  phone: { label: "Điện thoại", width: 390, height: 780, icon: Smartphone },
  pc: { label: "PC", width: 1366, height: 800, icon: Monitor },
} as const;
type Device = keyof typeof DEVICES;

/** Gom các lần gõ liên tiếp trước khi gửi sang iframe. */
const SEND_DELAY_MS = 200;

/** Xem trước trang web trong iframe đúng bề rộng thiết bị rồi thu nhỏ cho vừa khung (FR-16). */
export function WebPreview({ focusId }: { focusId: string | null }) {
  const doc = useEditorStore((s) => s.doc);
  const [device, setDevice] = useState<Device>("phone");
  const [replay, setReplay] = useState(0);
  const [ready, setReady] = useState(0);
  const [scale, setScale] = useState(0);
  const frame = useRef<HTMLIFrameElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const size = DEVICES[device];

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      const expected = {
        origin: window.location.origin,
        source: frame.current?.contentWindow,
        tag: "pls-preview" as const,
      };
      if (isBridgeMessage(event, expected)) setReady((n) => n + 1);
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);

  useEffect(() => {
    if (ready === 0) return;
    const timer = window.setTimeout(() => {
      const message: ToPreview = {
        source: "pls-editor",
        letter: { ...doc, slug: "xemthu", expires_at: "2099-12-31T00:00:00.000Z" },
        focusId,
        replay,
      };
      frame.current?.contentWindow?.postMessage(message, window.location.origin);
    }, SEND_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [doc, focusId, replay, ready]);

  useEffect(() => {
    const element = box.current!;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setScale(Math.max(0, Math.min(1, width / size.width, height / size.height)));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [size.width, size.height]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-center gap-2 border-b bg-card px-3 py-1.5">
        <div role="group" aria-label="Cỡ màn hình xem trước" className="flex rounded-lg border p-0.5">
          {(Object.keys(DEVICES) as Device[]).map((id) => {
            const Icon = DEVICES[id].icon;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={device === id}
                onClick={() => setDevice(id)}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground"
              >
                <Icon className="size-4" /> {DEVICES[id].label}
              </button>
            );
          })}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setReplay((n) => n + 1)}>
          <MailOpen /> Xem cách mở thư
        </Button>
        {replay > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setReplay(0)}>
            Về trang đã mở
          </Button>
        )}
      </div>
      <div
        ref={box}
        className="relative flex min-h-0 flex-1 items-start justify-center overflow-hidden bg-canvas"
      >
        {/* Khung ngoài giữ đúng kích thước sau khi thu nhỏ để canh giữa được. */}
        <div
          className="my-auto overflow-hidden rounded-lg border bg-background shadow-md"
          style={{ width: size.width * scale, height: size.height * scale }}
        >
          <iframe
            ref={frame}
            src={PREVIEW_PATH}
            title={`Xem trước trang web cỡ ${size.label}`}
            // Nhạc phát khi bấm mở phong bì trong khung xem trước.
            allow="autoplay"
            className="origin-top-left border-0"
            style={{ width: size.width, height: size.height, transform: `scale(${scale})` }}
          />
        </div>
      </div>
    </div>
  );
}
