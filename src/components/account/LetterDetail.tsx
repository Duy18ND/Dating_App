"use client";

import { ArrowLeft, Check, Copy, MessageCircleHeart, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CuteLoader } from "@/components/cute/CuteLoader";
import { DonatePanel } from "@/components/share/DonatePanel";
import { SharePanel } from "@/components/share/SharePanel";
import { Button, buttonVariants } from "@/components/ui/button";
import { AuthRequiredError, deleteMyLetter, getMyLetter } from "@/lib/client/api";
import { markResponsesSeen } from "@/lib/response-seen";
import { loginPath } from "@/lib/safe-redirect";
import { describeResponse, isReplyResponse, summarizeResponses } from "@/lib/responses";
import type { LetterResponse, ManagedLetter } from "@/types/letter";
import { ExpiryNotice } from "./ExpiryNotice";

const date = (iso: string) => new Date(iso).toLocaleString("vi-VN");

function BackLink() {
  return (
    <Link href="/thiep-cua-toi" className="inline-flex items-center gap-1 text-sm text-muted-foreground underline">
      <ArrowLeft className="size-4" /> Thiệp của tôi
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="lift rounded-2xl border bg-card p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold">{value}</dd>
    </div>
  );
}

function ReplyCard({ response }: { response: LetterResponse }) {
  const [copied, setCopied] = useState(false);
  const summaryText = describeResponse(response);
  const badgeTone = isReplyResponse(response)
    ? "bg-primary/10 text-primary border-primary/20"
    : response.action_type === "accept" && response.status === "yes"
      ? "bg-emerald-500/10 text-emerald-800 border-emerald-500/20"
      : response.action_type === "accept"
        ? "bg-muted text-muted-foreground border-border"
        : "bg-accent text-foreground border-border";

  const copyPayload = [
    response.responder_name || "Người nhận",
    summaryText,
    response.message ? `“${response.message}”` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="space-y-2.5 rounded-xl border bg-card p-4 text-sm shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-foreground">{response.responder_name || "Ẩn danh"}</span>
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeTone}`}>
            {summaryText}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{date(response.created_at)}</span>
          <button
            type="button"
            aria-label="Sao chép phản hồi"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(copyPayload);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1800);
              } catch {
                // Bỏ qua khi không có quyền clipboard.
              }
            }}
            className="inline-flex size-7 items-center justify-center rounded-md border text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
          </button>
        </div>
      </div>
      {response.message && (
        <blockquote className="rounded-lg border-l-2 border-primary/50 bg-accent/45 px-3.5 py-2.5 whitespace-pre-wrap text-foreground">
          “{response.message}”
        </blockquote>
      )}
    </li>
  );
}

/** Chi tiết một thiệp của chính chủ: số liệu, hộp thư phản hồi, chia sẻ. */
export function LetterDetail({ id }: { id: string }) {
  const router = useRouter();
  const [letter, setLetter] = useState<ManagedLetter>();
  const [loadedAt, setLoadedAt] = useState(0);
  const [error, setError] = useState<string>();
  const [needsLogin, setNeedsLogin] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const lastReloadRef = useRef(0);
  const reload = useCallback(() => {
    lastReloadRef.current = Date.now();
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    let active = true;
    getMyLetter(id).then(
      (data) => {
        if (!active) return;
        setLetter(data);
        setLoadedAt(Date.now());
        lastReloadRef.current = Date.now();
        setError(undefined);
        markResponsesSeen(data.id, data.responses.length);
      },
      (cause: Error) => {
        if (!active) return;
        setNeedsLogin(cause instanceof AuthRequiredError);
        setError(cause.message);
      },
    );
    return () => {
      active = false;
    };
  }, [id, attempt]);

  // Tự tải lại phản hồi mới khi chủ thiệp quay lại tab (giãn cách tối thiểu 15 giây).
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - lastReloadRef.current > 15_000) {
        reload();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [reload]);

  if (!letter) {
    return error ? (
      <div className="space-y-3">
        <p role="alert" className="text-destructive">
          {error}
        </p>
        {needsLogin ? (
          <Link href={loginPath(`/thiep-cua-toi/${id}`)} className={buttonVariants()}>
            Đăng nhập lại
          </Link>
        ) : (
          <Button type="button" onClick={reload}>
            Thử lại
          </Button>
        )}
        <BackLink />
      </div>
    ) : (
      <CuteLoader />
    );
  }

  async function remove() {
    if (!letter) return;
    if (!window.confirm("Xóa thiệp này? Thiệp, phản hồi và mã QR sẽ ngừng hoạt động ngay.")) return;
    setDeleting(true);
    try {
      await deleteMyLetter(letter.id);
      router.replace("/thiep-cua-toi");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Chưa xóa được, hãy thử lại.");
      setDeleting(false);
    }
  }

  const summary = summarizeResponses(letter.responses);
  const { blocks } = letter.web_config;

  return (
    <div className="anim-rise space-y-8">
      <header className="space-y-2">
        <BackLink />
        <h1 className="text-2xl font-semibold">{letter.title || "Thiệp của bạn"}</h1>
        <p className="text-sm text-muted-foreground">Tạo lúc {date(letter.created_at)}.</p>
        <ExpiryNotice expiresAt={letter.expires_at} now={loadedAt} detailed />
        <div className="flex flex-wrap gap-2">
          <Link href={`/editor?id=${letter.id}`} className={buttonVariants()}>
            Sửa thiệp
          </Link>
          <a
            href={`/l/${letter.slug}`}
            target="_blank"
            rel="noopener"
            className={buttonVariants({ variant: "outline" })}
          >
            Xem thử (không tính lượt mở)
          </a>
          <Button type="button" variant="outline" onClick={reload}>
            Tải lại số liệu
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-destructive"
            disabled={deleting}
            onClick={remove}
          >
            <Trash2 /> {deleting ? "Đang xóa..." : "Xóa thiệp"}
          </Button>
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </header>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Lượt mở thư" value={letter.view_count} />
        <Stat label="Tổng phản hồi" value={letter.responses.length} />
        {(blocks.reply?.enabled || summary.replies > 0) && (
          <Stat label="Hồi âm thư" value={summary.replies} />
        )}
        {blocks.acceptButton?.enabled && (
          <Stat label="Đồng ý / Từ chối" value={`${summary.accepted} / ${summary.declined}`} />
        )}
        {blocks.rsvp?.enabled && <Stat label="Tổng khách tham dự" value={summary.guests} />}
      </dl>

      {summary.poll.size > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold">Kết quả bình chọn</h2>
          <ul className="space-y-1 text-sm">
            {[...summary.poll]
              .sort((a, b) => b[1] - a[1])
              .map(([option, count]) => (
                <li key={option}>
                  {option}: {count} phiếu
                </li>
              ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="inline-flex items-center gap-2 font-semibold">
          <MessageCircleHeart className="size-4 text-primary" /> Hộp thư hồi âm & phản hồi
        </h2>
        {letter.responses.length === 0 ? (
          <p className="rounded-xl border border-dashed bg-card/60 p-4 text-sm text-muted-foreground">
            Chưa có phản hồi nào. Khi người nhận bấm xác nhận hoặc viết hồi âm, câu trả lời sẽ hiện
            ngay tại đây.
          </p>
        ) : (
          <ul className="space-y-3">
            {letter.responses.map((response) => (
              <ReplyCard key={response.id} response={response} />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Chia sẻ</h2>
        <SharePanel
          slug={letter.slug}
          canvas={letter.canvas_data}
          envelopeColor={letter.web_config.envelopeColor}
          recipientName={letter.web_config.recipientName}
        />
      </section>

      <DonatePanel />
    </div>
  );
}
