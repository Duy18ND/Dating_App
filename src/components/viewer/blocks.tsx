"use client";

import confetti from "canvas-confetti";
import { MapPin } from "lucide-react";
import { useState, type ReactNode } from "react";
import { inputClass } from "@/components/editor/ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { sendResponse } from "@/lib/client/api";
import { formatEventDate, mapsLink } from "@/lib/event";
import type { ResponseInput } from "@/lib/validation";
import type { WebConfig } from "@/types/letter";

type Blocks = Required<WebConfig["blocks"]>;
interface BlockProps {
  slug: string;
  recipient: string;
}

/** Gửi một phản hồi; giữ trạng thái đang gửi, lỗi và đã gửi xong. */
function useResponse(slug: string) {
  const [state, setState] = useState<{ busy?: boolean; error?: string; sent?: ResponseInput }>({});
  async function send(input: ResponseInput) {
    if (state.busy) return false;
    setState({ busy: true });
    try {
      await sendResponse(slug, input);
      setState({ sent: input });
      return true;
    } catch (cause) {
      setState({ error: cause instanceof Error ? cause.message : "Gửi không được, hãy thử lại." });
      return false;
    }
  }
  return { ...state, send };
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border bg-card p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Problem({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  ) : null;
}

const Thanks = ({ children }: { children: ReactNode }) => (
  <p role="status" className="font-medium text-primary">
    {children}
  </p>
);

const MAX_DODGES = 5;
const randomOffset = () => ({
  x: Math.round((Math.random() - 0.5) * 220),
  y: Math.round((Math.random() - 0.5) * 120),
});

export function AcceptBlock({ slug, recipient, block }: BlockProps & { block: Blocks["acceptButton"] }) {
  const { busy, error, sent, send } = useResponse(slug);
  const [dodge, setDodge] = useState({ count: 0, x: 0, y: 0 });
  const name = recipient || undefined;

  async function answer(status: "yes" | "no") {
    const ok = await send({ action_type: "accept", status, responder_name: name });
    if (ok && status === "yes") {
      void confetti({ particleCount: 160, spread: 90, origin: { y: 0.7 }, disableForReducedMotion: true });
    }
  }

  const escape = () => setDodge(({ count }) => ({ count: count + 1, ...randomOffset() }));
  // Né tối đa vài lần rồi chịu thua: người nhận vẫn phải từ chối được.
  const canDodge = () =>
    block.dodgeNo &&
    dodge.count < MAX_DODGES &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <Card title={block.question}>
      {sent?.action_type === "accept" ? (
        <Thanks>
          {sent.status === "yes" ? "Tuyệt vời! Câu trả lời đã được gửi đi." : "Đã gửi câu trả lời của bạn."}
        </Thanks>
      ) : (
        <div className="flex min-h-24 flex-wrap items-center justify-center gap-4">
          <Button type="button" size="lg" disabled={busy} onClick={() => answer("yes")}>
            {block.yesText}
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            disabled={busy}
            className="relative transition-transform duration-200"
            style={{ transform: `translate(${dodge.x}px, ${dodge.y}px)` }}
            onPointerEnter={(event) => event.pointerType === "mouse" && canDodge() && escape()}
            onClick={(event) => {
              // detail = 0 là bấm bằng bàn phím: không né để người dùng bàn phím vẫn chọn được.
              if (event.detail > 0 && canDodge()) escape();
              else void answer("no");
            }}
          >
            {block.noText}
          </Button>
        </div>
      )}
      <Problem message={error} />
    </Card>
  );
}

export function RsvpBlock({ slug, recipient, block }: BlockProps & { block: Blocks["rsvp"] }) {
  const { busy, error, sent, send } = useResponse(slug);
  const [name, setName] = useState(recipient);
  const [status, setStatus] = useState<"attending" | "not_attending">("attending");
  const [guests, setGuests] = useState(1);
  const [message, setMessage] = useState("");

  return (
    <Card title="Xác nhận tham dự">
      <div className="space-y-1 text-sm">
        <p className="font-medium">{formatEventDate(block.eventDate)}</p>
        <p>{block.locationName}</p>
        <a
          href={mapsLink(block.mapsUrl, block.locationName)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline", size: "sm", className: "mt-2" })}
        >
          <MapPin /> Chỉ đường trên Google Maps
        </a>
      </div>

      {sent ? (
        <Thanks>Đã ghi nhận. Cảm ơn bạn đã phản hồi!</Thanks>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void send({
              action_type: "rsvp",
              status,
              guest_count: guests,
              responder_name: name.trim(),
              message,
            });
          }}
        >
          <input
            className={inputClass}
            aria-label="Tên của bạn"
            placeholder="Tên của bạn"
            required
            maxLength={100}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <fieldset className="flex gap-4 text-sm">
            <legend className="sr-only">Bạn có tham dự không?</legend>
            {(
              [
                ["attending", "Mình sẽ đến"],
                ["not_attending", "Mình không đến được"],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="rsvp-status"
                  className="accent-primary"
                  checked={status === value}
                  onChange={() => setStatus(value)}
                />
                {label}
              </label>
            ))}
          </fieldset>
          {status === "attending" && (
            <label className="flex items-center gap-2 text-sm">
              Số người đi
              <select
                className={`${inputClass} w-24`}
                value={guests}
                onChange={(event) => setGuests(Number(event.target.value))}
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
          )}
          <textarea
            className={inputClass}
            aria-label="Lời chúc"
            placeholder="Lời chúc (không bắt buộc)"
            rows={3}
            maxLength={1000}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          <Button type="submit" disabled={busy || !name.trim()}>
            {busy ? "Đang gửi..." : "Gửi xác nhận"}
          </Button>
        </form>
      )}
      <Problem message={error} />
    </Card>
  );
}

export function PollBlock({ slug, recipient, block }: BlockProps & { block: Blocks["poll"] }) {
  const { busy, error, sent, send } = useResponse(slug);
  const [choice, setChoice] = useState("");

  return (
    <Card title={block.question}>
      {sent?.action_type === "poll" ? (
        <Thanks>Bạn đã chọn “{sent.poll_option}”.</Thanks>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void send({
              action_type: "poll",
              poll_option: choice,
              responder_name: recipient || undefined,
            });
          }}
        >
          <fieldset className="space-y-2">
            <legend className="sr-only">{block.question}</legend>
            {block.options.map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-3 rounded-md border p-3 has-checked:border-primary has-checked:bg-accent"
              >
                <input
                  type="radio"
                  name="poll"
                  className="accent-primary"
                  checked={choice === option}
                  onChange={() => setChoice(option)}
                />
                {option}
              </label>
            ))}
          </fieldset>
          <Button type="submit" disabled={busy || !choice}>
            {busy ? "Đang gửi..." : "Gửi bình chọn"}
          </Button>
        </form>
      )}
      <Problem message={error} />
    </Card>
  );
}
