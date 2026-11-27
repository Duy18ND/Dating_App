"use client";

import { useEffect, useState } from "react";
import { inputClass } from "@/components/editor/ui";
import { Button } from "@/components/ui/button";
import { deleteAccount } from "@/lib/client/api";
import { DELETE_ACCOUNT_CONFIRM } from "@/lib/my-letters";
import { authBrowser } from "@/lib/supabase/browser";
import { SignOutButton } from "./SignOutButton";

/** Email đang đăng nhập, đăng xuất và xóa tài khoản (hỏi xác nhận bằng cách gõ chữ). */
export function AccountPanel() {
  const [email, setEmail] = useState<string>();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    authBrowser()
      .auth.getUser()
      .then(({ data }) => active && setEmail(data.user?.email ?? undefined))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function remove() {
    setBusy(true);
    setError(undefined);
    try {
      await deleteAccount(typed);
      await authBrowser().auth.signOut().catch(() => {});
      window.location.replace("/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Chưa xóa được, hãy thử lại.");
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="tai-khoan" className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="tai-khoan" className="font-semibold">
          Tài khoản
        </h2>
        <SignOutButton />
      </div>
      {email && <p className="text-sm text-muted-foreground">Đang đăng nhập: {email}</p>}
      {!open ? (
        <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setOpen(true)}>
          Xóa tài khoản
        </Button>
      ) : (
        <div className="space-y-2 rounded-md border border-destructive/40 p-3 text-sm">
          <p>
            Xóa tài khoản sẽ xóa <strong>ngay</strong> toàn bộ thiệp và phản hồi; mọi mã QR đã in
            ngừng hoạt động. Ảnh bị xóa khỏi kho trong lần dọn dẹp tới. Không thể hoàn tác.
          </p>
          <label className="block space-y-1">
            <span>
              Gõ <strong>{DELETE_ACCOUNT_CONFIRM}</strong> để xác nhận
            </span>
            <input
              className={inputClass}
              value={typed}
              autoComplete="off"
              onChange={(event) => setTyped(event.target.value)}
            />
          </label>
          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="destructive"
              disabled={busy || typed !== DELETE_ACCOUNT_CONFIRM}
              onClick={remove}
            >
              {busy ? "Đang xóa..." : "Xóa vĩnh viễn"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Hủy
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
