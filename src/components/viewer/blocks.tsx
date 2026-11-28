"use client";

import { Check, Copy, MapPin, Send } from "lucide-react";
import { useState, type ReactNode } from "react";
import { inputClass } from "@/components/editor/ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { runCelebration } from "@/lib/celebrate";
import { sendResponse } from "@/lib/client/api";
import { formatEventDate, mapsLink } from "@/lib/event";
import { DEFAULT_REPLY_REACTIONS } from "@/lib/responses";
import type { ResponseInput } from "@/lib/validation";
import type { WebCelebrateEffect, WebConfig, WebIntensity } from "@/types/letter";

type Blocks = Required<WebConfig["blocks"]>;
interface BlockProps {
  slug: string;
  recipient: string;
  /** Chế độ xem thử (/xem-thu/[mau]): mô phỏng phản hồi, không gọi API lưu DB. */
  preview?: boolean;
}

/** Gửi một phản hồi; giữ trạng thái đang gửi, lỗi và đã gửi xong. */
function useResponse(slug: string, preview?: boolean) {
  const [state, setState] = useState<{ busy?: boolean; error?: string; sent?: ResponseInput }>({});
  async function send(input: ResponseInput) {
    if (state.busy) return false;
    if (preview) {
      setState({ sent: input });
      return true;
    }
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

function CopySummaryButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        } catch {
          // Bỏ qua khi trình duyệt không hỗ trợ clipboard.
        }
      }}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Đã chép câu trả lời" : "Chép để gửi thêm qua chat"}
    </Button>
  );
}

const Thanks = ({ children, copyText }: { children: ReactNode; copyText?: string }) => (
  <div role="status" className="space-y-2.5 rounded-lg border border-primary/20 bg-accent/50 p-3.5">
    <p className="font-medium text-primary">{children}</p>
    <p className="text-xs text-muted-foreground">
      Câu trả lời đã được gửi thẳng về tài khoản của người viết thư.
    </p>
    {copyText && <CopySummaryButton text={copyText} />}
  </div>
);

const DODGE_TEASES = [
  "Ơ kìa, bấm nút bên kia cơ mà 😆",
  "Đừng né nữa, bấm Đồng ý đi mà 🥺",
  "Nút này hỏng rồi, chỉ bấm được Đồng ý thôi 💌",
  "Cố nữa nút cũng chạy tiếp á 🏃‍♂️",
  "Thôi mà, gật đầu một cái cho vui lòng người viết đi ❤️",
] as const;

function nextDodgeOffset(prev: { x: number; y: number }) {
  for (let i = 0; i < 6; i++) {
    const x = Math.round((Math.random() - 0.5) * 210);
    const y = Math.round((Math.random() - 0.5) * 84);
    if (Math.hypot(x - prev.x, y - prev.y) >= 65) return { x, y };
  }
  return { x: prev.x >= 0 ? -90 : 90, y: prev.y >= 0 ? -36 : 36 };
}

export function AcceptBlock({
  slug,
  recipient,
  preview,
  celebrate = "confetti",
  intensity = "medium",
  block,
}: BlockProps & {
  block: Blocks["acceptButton"];
  celebrate?: WebCelebrateEffect;
  intensity?: WebIntensity;
}) {
  const { busy, error, sent, send } = useResponse(slug, preview);
  const [dodge, setDodge] = useState({ count: 0, x: 0, y: 0 });
  const [note, setNote] = useState("");
  const name = recipient || undefined;

  async function answer(status: "yes" | "no") {
    const trimmedNote = note.trim() || undefined;
    const ok = await send({
      action_type: "accept",
      status,
      responder_name: name,
      message: trimmedNote,
    });
    if (ok && status === "yes") {
      runCelebration(celebrate, intensity);
    }
  }

  const escape = () =>
    setDodge((cur) => ({ count: cur.count + 1, ...nextDodgeOffset(cur) }));

  // Khi bật bắt buộc Đồng ý (dodgeNo): nút Từ chối chạy mãi không bấm được, nút Đồng ý to dần.
  const mustAccept = block.dodgeNo;
  const yesScale = mustAccept ? Math.min(1.24, 1 + dodge.count * 0.05) : 1;
  const tease =
    mustAccept && dodge.count > 0
      ? DODGE_TEASES[(dodge.count - 1) % DODGE_TEASES.length]
      : undefined;

  const copyText =
    sent?.action_type === "accept"
      ? [
          `Mình vừa trả lời thư: ${sent.status === "yes" ? block.yesText : block.noText}`,
          sent.message ? `“${sent.message}”` : "",
        ]
          .filter(Boolean)
          .join(" — ")
      : undefined;

  return (
    <Card title={block.question}>
      {sent?.action_type === "accept" ? (
        <Thanks copyText={copyText}>
          {sent.status === "yes"
            ? `Tuyệt vời! Bạn đã chọn “${block.yesText}”.`
            : `Đã ghi nhận câu trả lời “${block.noText}”.`}
        </Thanks>
      ) : (
        <div className="space-y-3">
          <input
            className={inputClass}
            aria-label="Lời nhắn kèm theo (không bắt buộc)"
            placeholder="Nhắn kèm thêm một câu cho người viết (không bắt buộc)..."
            maxLength={300}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <div className="flex min-h-24 flex-wrap items-center justify-center gap-4 py-2">
            <Button
              type="button"
              size="lg"
              disabled={busy}
              className="transition-transform duration-200"
              style={yesScale > 1 ? { transform: `scale(${yesScale})` } : undefined}
              onClick={() => answer("yes")}
            >
              {block.yesText}
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              disabled={busy}
              className="relative transition-transform duration-150"
              style={{ transform: `translate(${dodge.x}px, ${dodge.y}px)` }}
              onPointerEnter={(event) => {
                if (mustAccept && event.pointerType === "mouse") escape();
              }}
              onPointerDown={(event) => {
                if (mustAccept) {
                  event.preventDefault();
                  escape();
                }
              }}
              onClick={(event) => {
                if (mustAccept) {
                  event.preventDefault();
                  escape();
                } else {
                  void answer("no");
                }
              }}
            >
              {block.noText}
            </Button>
          </div>
          {tease && (
            <p role="status" className="text-center text-xs font-medium text-primary">
              {tease}
            </p>
          )}
        </div>
      )}
      <Problem message={error} />
    </Card>
  );
}

export function RsvpBlock({
  slug,
  recipient,
  preview,
  block,
}: BlockProps & { block: Blocks["rsvp"] }) {
  const { busy, error, sent, send } = useResponse(slug, preview);
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

export function PollBlock({
  slug,
  recipient,
  preview,
  block,
}: BlockProps & { block: Blocks["poll"] }) {
  const { busy, error, sent, send } = useResponse(slug, preview);
  const [choice, setChoice] = useState("");
  const [note, setNote] = useState("");

  const copyText =
    sent?.action_type === "poll"
      ? [`Mình đã bình chọn: ${sent.poll_option}`, sent.message ? `“${sent.message}”` : ""]
          .filter(Boolean)
          .join(" — ")
      : undefined;

  return (
    <Card title={block.question}>
      {sent?.action_type === "poll" ? (
        <Thanks copyText={copyText}>Bạn đã chọn “{sent.poll_option}”.</Thanks>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void send({
              action_type: "poll",
              poll_option: choice,
              responder_name: recipient || undefined,
              message: note.trim() || undefined,
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
          <input
            className={inputClass}
            aria-label="Ghi chú thêm (không bắt buộc)"
            placeholder="Nhắn thêm gì đó (không bắt buộc)..."
            maxLength={300}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <Button type="submit" disabled={busy || !choice}>
            {busy ? "Đang gửi..." : "Gửi bình chọn"}
          </Button>
        </form>
      )}
      <Problem message={error} />
    </Card>
  );
}

/** Khối xác nhận đã đọc & gửi hồi âm riêng về thẳng tài khoản chủ thiệp. */
export function ReplyBlock({
  slug,
  recipient,
  preview,
  celebrate = "confetti",
  intensity = "medium",
  block,
}: BlockProps & {
  block: Blocks["reply"];
  celebrate?: WebCelebrateEffect;
  intensity?: WebIntensity;
}) {
  const { busy, error, sent, send } = useResponse(slug, preview);
  const reactions = (block.quickReactions ?? [...DEFAULT_REPLY_REACTIONS])
    .map((r) => r.trim())
    .filter(Boolean);
  const [name, setName] = useState(recipient);
  const [reaction, setReaction] = useState(reactions[0] ?? "");
  const [message, setMessage] = useState("");

  const canSend = Boolean(reaction.trim() || message.trim());
  const copyText =
    sent?.action_type === "reply"
      ? [
          "Mình vừa đọc bức thư của cậu rồi nè 💌",
          sent.reaction ? `(${sent.reaction})` : "",
          sent.message ? `“${sent.message}”` : "",
        ]
          .filter(Boolean)
          .join(" ")
      : undefined;

  return (
    <Card title={block.prompt || "Xác nhận & gửi hồi âm thư"}>
      {sent?.action_type === "reply" ? (
        <Thanks copyText={copyText}>
          {sent.reaction ? `Đã gửi xác nhận “${sent.reaction}”!` : "Đã gửi hồi âm của bạn!"}
        </Thanks>
      ) : (
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!canSend) return;
            const ok = await send({
              action_type: "reply",
              reaction: reaction.trim() || undefined,
              responder_name: name.trim() || undefined,
              message: message.trim() || undefined,
            });
            if (ok) runCelebration(celebrate, intensity);
          }}
        >
          {reactions.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Chọn xác nhận nhanh</p>
              <div className="flex flex-wrap gap-2">
                {reactions.map((item) => {
                  const active = reaction === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setReaction(active ? "" : item)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-background text-foreground hover:border-primary/60 hover:bg-accent"
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <input
            className={inputClass}
            aria-label="Tên của bạn"
            placeholder="Tên của bạn (không bắt buộc)"
            maxLength={100}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <textarea
            className={inputClass}
            aria-label="Lời hồi âm"
            placeholder={block.placeholder || "Viết vài dòng trả lời hoặc cảm nhận của cậu..."}
            rows={3}
            maxLength={1000}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          <Button type="submit" disabled={busy || !canSend} className="w-full sm:w-auto">
            <Send className="size-4" />
            {busy ? "Đang gửi hồi âm..." : "Xác nhận & gửi hồi âm"}
          </Button>
        </form>
      )}
      <Problem message={error} />
    </Card>
  );
}
