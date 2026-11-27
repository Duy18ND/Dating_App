"use client";

import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CuteLoader } from "@/components/cute/CuteLoader";
import { DonatePanel } from "@/components/share/DonatePanel";
import { SharePanel } from "@/components/share/SharePanel";
import { Button, buttonVariants } from "@/components/ui/button";
import { AuthRequiredError, deleteMyLetter, getMyLetter } from "@/lib/client/api";
import { loginPath } from "@/lib/safe-redirect";
import { describeResponse, summarizeResponses } from "@/lib/responses";
import type { ManagedLetter } from "@/types/letter";
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

/** Chi tiết một thiệp của chính chủ: số liệu, phản hồi, chia sẻ. */
export function LetterDetail({ id }: { id: string }) {
  const router = useRouter();
  const [letter, setLetter] = useState<ManagedLetter>();
  const [loadedAt, setLoadedAt] = useState(0);
  const [error, setError] = useState<string>();
  const [needsLogin, setNeedsLogin] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let active = true;
    getMyLetter(id).then(
      (data) => {
        if (!active) return;
        setLetter(data);
        setLoadedAt(Date.now());
        setError(undefined);
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
        <Stat label="Phản hồi" value={letter.responses.length} />
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
        <h2 className="font-semibold">Phản hồi và lời chúc</h2>
        {letter.responses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Chưa có phản hồi nào. Gửi link cho người nhận rồi quay lại đây nhé.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border bg-card">
            {letter.responses.map((response) => (
              <li key={response.id} className="space-y-1 p-3 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium">{response.responder_name || "Ẩn danh"}</span>
                  <span className="text-muted-foreground">{date(response.created_at)}</span>
                </div>
                <p>{describeResponse(response)}</p>
                {response.message && <p className="whitespace-pre-wrap">“{response.message}”</p>}
              </li>
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
        />
      </section>

      <DonatePanel />
    </div>
  );
}
