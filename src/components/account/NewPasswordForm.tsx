"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { MIN_PASSWORD } from "@/lib/auth-account";
import { AFTER_LOGIN } from "@/lib/safe-redirect";
import { authBrowser } from "@/lib/supabase/browser";
import { PasswordField } from "./AuthFields";

/** Đặt mật khẩu mới sau khi bấm link trong email (phiên tạm đã có từ /auth/callback). */
export function NewPasswordForm() {
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [againError, setAgainError] = useState<string>();
  const [error, setError] = useState<string>();

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password !== again) return setAgainError("Hai mật khẩu chưa giống nhau.");
    setBusy(true);
    setError(undefined);
    const { error } = await authBrowser().auth.updateUser({ password });
    if (error) {
      setError(
        `Chưa đổi được mật khẩu. Mật khẩu cần ít nhất ${MIN_PASSWORD} ký tự và khác mật khẩu cũ.`,
      );
      setBusy(false);
      return;
    }
    window.location.assign(AFTER_LOGIN);
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <h1 className="text-center font-playfair text-2xl text-primary sm:text-3xl">
        Đặt mật khẩu mới
      </h1>
      <PasswordField
        label="Mật khẩu mới"
        autoComplete="new-password"
        required
        minLength={MIN_PASSWORD}
        value={password}
        hint={`Ít nhất ${MIN_PASSWORD} ký tự.`}
        onChange={(event) => setPassword(event.target.value)}
      />
      <PasswordField
        label="Nhập lại mật khẩu mới"
        autoComplete="new-password"
        required
        value={again}
        error={againError}
        onChange={(event) => {
          setAgain(event.target.value);
          setAgainError(undefined);
        }}
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" className="h-11 w-full text-base" disabled={busy}>
        {busy ? "Đang lưu..." : "Lưu mật khẩu mới"}
      </Button>
    </form>
  );
}
