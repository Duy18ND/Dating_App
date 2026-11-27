"use client";

import { Eye, MessageCircle, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { LetterView } from "@/components/letter/LetterView";
import { Button, buttonVariants } from "@/components/ui/button";
import { AuthRequiredError, deleteMyLetter, listMyLetters } from "@/lib/client/api";
import { formatDate, letterNames } from "@/lib/my-letters";
import { loginPath } from "@/lib/safe-redirect";
import type { LetterSummary } from "@/types/letter";
import { ExpiryNotice } from "./ExpiryNotice";

type State =
  | { status: "loading" }
  | { status: "error"; message: string; login: boolean }
  | { status: "ready"; letters: LetterSummary[]; now: number };

function LetterCard({
  letter,
  name,
  now,
  onDeleted,
}: {
  letter: LetterSummary;
  name: string;
  now: number;
  onDeleted: (id: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function remove() {
    if (!window.confirm(`Xóa “${name}”? Thiệp, phản hồi và mã QR sẽ ngừng hoạt động ngay.`)) return;
    setBusy(true);
    setError(undefined);
    try {
      await deleteMyLetter(letter.id);
      onDeleted(letter.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Chưa xóa được, hãy thử lại.");
      setBusy(false);
    }
  }

  return (
    <li className="flex flex-col gap-3 rounded-lg border bg-card p-3">
      <Link
        href={`/thiep-cua-toi/${letter.id}`}
        className="block overflow-hidden rounded-sm border"
        aria-label={`Mở chi tiết ${name}`}
      >
        {letter.front ? (
          <LetterView face={letter.front} qrUrl="" listening={false} />
        ) : (
          <div className="aspect-[1760/1240] bg-muted" />
        )}
      </Link>
      <div className="space-y-1">
        <h2 className="font-semibold">
          <Link href={`/thiep-cua-toi/${letter.id}`} className="hover:underline">
            {name}
          </Link>
        </h2>
        <p className="text-xs text-muted-foreground">Tạo {formatDate(letter.created_at)}</p>
        <ExpiryNotice expiresAt={letter.expires_at} now={now} />
        <p className="flex gap-4 text-sm">
          <span className="inline-flex items-center gap-1">
            <Eye aria-hidden className="size-4" /> {letter.view_count} lượt mở
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle aria-hidden className="size-4" /> {letter.response_count} phản hồi
          </span>
        </p>
      </div>
      <div className="mt-auto flex flex-wrap gap-2">
        <Link href={`/editor?id=${letter.id}`} className={buttonVariants({ size: "sm" })}>
          <Pencil /> Sửa
        </Link>
        <Link
          href={`/thiep-cua-toi/${letter.id}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          QR, PDF & chia sẻ
        </Link>
        <a
          href={`/l/${letter.slug}`}
          target="_blank"
          rel="noopener"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          Xem thử
        </a>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive"
          disabled={busy}
          onClick={remove}
        >
          <Trash2 /> {busy ? "Đang xóa..." : "Xóa"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </li>
  );
}

/** FR-14: danh sách thiệp của chính tài khoản, mới nhất trước. */
export function MyLetters() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let active = true;
    listMyLetters().then(
      (letters) => active && setState({ status: "ready", letters, now: Date.now() }),
      (cause: Error) =>
        active &&
        setState({ status: "error", message: cause.message, login: cause instanceof AuthRequiredError }),
    );
    return () => {
      active = false;
    };
  }, [attempt]);

  if (state.status === "loading") return <p className="text-muted-foreground">Đang tải...</p>;
  if (state.status === "error") {
    return (
      <div className="space-y-3">
        <p role="alert" className="text-destructive">
          {state.message}
        </p>
        {state.login ? (
          <Link href={loginPath("/thiep-cua-toi")} className={buttonVariants()}>
            Đăng nhập lại
          </Link>
        ) : (
          <Button type="button" onClick={reload}>
            Thử lại
          </Button>
        )}
      </div>
    );
  }

  const names = letterNames(state.letters);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {state.letters.length === 0
            ? "Bạn chưa có thiệp nào."
            : `${state.letters.length} thiệp. Mỗi thiệp tự xóa sau 60 ngày.`}
        </p>
        <Link href="/#mau-thu" className={buttonVariants()}>
          <Plus /> Tạo thiệp mới
        </Link>
      </div>
      {state.letters.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {state.letters.map((letter) => (
            <LetterCard
              key={letter.id}
              letter={letter}
              name={names.get(letter.id)!}
              now={state.now}
              onDeleted={(id) =>
                setState({ ...state, letters: state.letters.filter((l) => l.id !== id) })
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}
