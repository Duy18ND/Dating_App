"use client";

import { useState, type FormEvent } from "react";
import { inputClass } from "@/components/editor/ui";
import { Button } from "@/components/ui/button";
import { AFTER_LOGIN } from "@/lib/safe-redirect";
import { authBrowser } from "@/lib/supabase/browser";

const MIN_PASSWORD = 8;

/** Đặt mật khẩu mới sau khi bấm link trong email (phiên tạm đã có từ /auth/callback). */
export function NewPasswordForm() {
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password !== again) return setError("Hai mật khẩu chưa giống nhau.");
    setBusy(true);
    setError(undefined);
    const { error } = await authBrowser().auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setError(`Chưa đổi được mật khẩu. Mật khẩu cần ít nhất ${MIN_PASSWORD} ký tự và khác mật khẩu cũ.`);
      return;
    }
    window.location.assign(AFTER_LOGIN);
  }

  return (
    <form className="space-y-3" onSubmit={submit}>
      <h1 className="text-center font-playfair text-3xl text-primary">Đặt mật khẩu mới</h1>
      {[
        { label: `Mật khẩu mới (ít nhất ${MIN_PASSWORD} ký tự)`, value: password, set: setPassword },
        { label: "Nhập lại mật khẩu mới", value: again, set: setAgain },
      ].map((field) => (
        <label key={field.label} className="block space-y-1">
          <span className="text-sm font-medium">{field.label}</span>
          <input
            className={inputClass}
            type="password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD}
            maxLength={72}
            value={field.value}
            onChange={(event) => field.set(event.target.value)}
          />
        </label>
      ))}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Đang lưu..." : "Lưu mật khẩu mới"}
      </Button>
    </form>
  );
}
