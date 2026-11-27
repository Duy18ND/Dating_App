"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DonatePanel } from "@/components/share/DonatePanel";
import { SharePanel } from "@/components/share/SharePanel";
import { Button, buttonVariants } from "@/components/ui/button";
import { getMyLetter } from "@/lib/client/api";
import { describeResponse, summarizeResponses } from "@/lib/responses";
import type { ManagedLetter } from "@/types/letter";

const date = (iso: string) => new Date(iso).toLocaleString("vi-VN");

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold">{value}</dd>
    </div>
  );
}

/** Chi tiết một thiệp của chính chủ: số liệu, phản hồi, chia sẻ. */
export function LetterDetail({ id }: { id: string }) {
  const [letter, setLetter] = useState<ManagedLetter>();
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let active = true;
    getMyLetter(id).then(
      (data) => {
        if (!active) return;
        setLetter(data);
        setError(undefined);
      },
      (cause: Error) => active && setError(cause.message),
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
        <Button type="button" onClick={reload}>
          Thử lại
        </Button>
      </div>
    ) : (
      <p className="text-muted-foreground">Đang tải...</p>
    );
  }

  const summary = summarizeResponses(letter.responses);
  const { blocks } = letter.web_config;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{letter.title || "Lá thư của bạn"}</h1>
        <p className="text-sm text-muted-foreground">
          Tạo lúc {date(letter.created_at)}. Hết hạn lúc {date(letter.expires_at)}.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href={`/editor?id=${letter.id}`} className={buttonVariants()}>
            Chỉnh sửa thư
          </Link>
          <Button type="button" variant="outline" onClick={reload}>
            Tải lại số liệu
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
