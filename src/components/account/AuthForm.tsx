"use client";

import { AlertTriangle, ArrowLeft, Check, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { CopyButton } from "@/components/share/CopyButton";
import { Button } from "@/components/ui/button";
import {
  authErrorMessage,
  MIN_PASSWORD,
  parseAccountIdentifier,
  type AuthMode,
} from "@/lib/auth-account";
import { getTurnstileToken } from "@/lib/client/turnstile";
import { isInAppBrowser } from "@/lib/in-app-browser";
import { safeNext } from "@/lib/safe-redirect";
import { authBrowser, callbackUrl } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import { AuthField, PasswordField } from "./AuthFields";

const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

const HEADINGS: Record<AuthMode, { title: string; submit: string; busy: string }> = {
  login: { title: "Chào bạn quay lại", submit: "Đăng nhập", busy: "Đang đăng nhập..." },
  signup: { title: "Tạo tài khoản", submit: "Tạo tài khoản", busy: "Đang tạo tài khoản..." },
  forgot: { title: "Quên mật khẩu", submit: "Gửi link đặt lại mật khẩu", busy: "Đang gửi..." },
};

const TABS: { mode: AuthMode; label: string }[] = [
  { mode: "login", label: "Đăng nhập" },
  { mode: "signup", label: "Đăng ký" },
];

const noSubscribe = () => () => {};

function useInAppBrowser() {
  return useSyncExternalStore(
    noSubscribe,
    () => isInAppBrowser(navigator.userAgent),
    () => false,
  );
}

/** Trong Threads, Zalo, Messenger...: Google chặn đăng nhập. Hướng dẫn mở bằng Chrome/Safari. */
function InAppNotice() {
  const href = useSyncExternalStore(
    noSubscribe,
    () => window.location.href,
    () => "",
  );
  return (
    <div className="space-y-2 rounded-lg border border-primary/40 bg-accent p-3 text-sm">
      <p className="font-medium">Muốn dùng Google? Hãy mở bằng trình duyệt</p>
      <p>
        Google không cho đăng nhập bên trong Threads, Zalo, Messenger... Bấm nút ⋯ ở góc màn hình,
        chọn <strong>Mở bằng trình duyệt</strong>, hoặc sao chép link. Đăng nhập bằng mật khẩu bên
        dưới vẫn dùng được.
      </p>
      <CopyButton value={href} label="Sao chép link" />
    </div>
  );
}

function Rule({ met, children }: { met: boolean; children: string }) {
  return (
    <p className={cn("flex items-center gap-1.5", met && "text-[#2F6B3C]")}>
      <Check aria-hidden className={cn("size-3.5", !met && "opacity-30")} />
      {children}
      <span className="sr-only">{met ? " (đã đạt)" : " (chưa đạt)"}</span>
    </p>
  );
}

export function AuthForm() {
  const query = useSearchParams();
  const next = safeNext(query.get("next"));
  const linkFailed = query.get("loi") === "lien-ket";
  const inApp = useInAppBrowser();
  const [mode, setMode] = useState<AuthMode>(
    query.get("che-do") === "dang-ky" ? "signup" : "login",
  );
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [accountError, setAccountError] = useState<string>();
  const [againError, setAgainError] = useState<string>();
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();

  function clearMessages() {
    setAccountError(undefined);
    setAgainError(undefined);
    setError(undefined);
    setNotice(undefined);
  }

  /** Giữ tên tài khoản đã gõ, bỏ mật khẩu và thông báo cũ. */
  function switchMode(target: AuthMode) {
    setMode(target);
    setPassword("");
    setAgain("");
    clearMessages();
  }

  const parsed = parseAccountIdentifier(account);
  const typedUsername = account.trim() !== "" && !account.includes("@");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    clearMessages();

    if (!parsed.ok) return setAccountError(parsed.error);
    if (mode === "forgot" && parsed.kind === "username") {
      return setAccountError(
        "Tài khoản dùng tên đăng nhập không có email nên không đặt lại được mật khẩu.",
      );
    }
    if (mode === "signup" && password !== again) {
      return setAgainError("Hai mật khẩu chưa giống nhau.");
    }

    setBusy(true);
    try {
      const supabase = authBrowser();
      const captchaToken = (await getTurnstileToken()) ?? undefined;
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(parsed.authEmail, {
          redirectTo: callbackUrl("/doi-mat-khau"),
          captchaToken,
        });
        if (error) throw error;
        setNotice("Nếu email này có tài khoản, chúng tôi đã gửi link đặt lại mật khẩu.");
        setBusy(false);
        return;
      }

      const result =
        mode === "login"
          ? await supabase.auth.signInWithPassword({
              email: parsed.authEmail,
              password,
              options: { captchaToken },
            })
          : await supabase.auth.signUp({
              email: parsed.authEmail,
              password,
              options: {
                captchaToken,
                ...(parsed.kind === "email"
                  ? { emailRedirectTo: callbackUrl(next) }
                  : { data: { username: parsed.display } }),
              },
            });
      if (result.error) throw result.error;
      if (result.data.session) {
        // Tải trang mới để proxy và server đọc được cookie phiên vừa tạo.
        // Giữ trạng thái bận cho tới khi trang mới hiện ra, tránh bấm hai lần.
        window.location.assign(next);
        return;
      }
      // Đăng ký mà chưa có phiên: máy chủ đang yêu cầu xác nhận email.
      if (parsed.kind === "email") {
        // Cùng một câu cho cả email đã có tài khoản: không lộ ai đã đăng ký.
        setNotice(
          "Nếu email hợp lệ, chúng tôi đã gửi link xác nhận. Hãy mở hộp thư (kể cả mục Spam) và bấm link.",
        );
      } else {
        setError("Chưa đăng nhập được bằng tên đăng nhập. Bạn hãy thử đăng ký bằng email.");
      }
      setBusy(false);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "";
      setError(
        // Thiếu biến môi trường: chỉ người phát triển gặp, giữ nguyên để biết sửa gì.
        message.includes("NEXT_PUBLIC_SUPABASE")
          ? message
          : authErrorMessage(message, mode, parsed.kind),
      );
      setBusy(false);
    }
  }

  async function google() {
    clearMessages();
    const { error } = await authBrowser().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl(next) },
    });
    if (error) setError("Chưa đăng nhập được bằng Google, hãy dùng mật khẩu.");
  }

  const heading = HEADINGS[mode];

  return (
    <div className="space-y-5">
      <header className="space-y-1 text-center">
        <h1 className="font-playfair text-2xl text-primary sm:text-3xl">{heading.title}</h1>
        <p className="text-sm text-muted-foreground">
          {mode === "forgot"
            ? "Chỉ dùng được cho tài khoản đăng ký bằng email."
            : next.startsWith("/editor")
              ? `${mode === "signup" ? "Tạo tài khoản" : "Đăng nhập"} để bắt đầu thiết kế thiệp của bạn.`
              : "Để tạo, sửa thiệp và xem phản hồi."}
        </p>
      </header>

      {mode === "forgot" ? (
        <button
          type="button"
          onClick={() => switchMode("login")}
          className="flex min-h-9 items-center gap-1.5 text-sm text-primary"
        >
          <ArrowLeft aria-hidden className="size-4" /> Quay lại đăng nhập
        </button>
      ) : (
        <div role="group" aria-label="Đăng nhập hoặc đăng ký" className="flex rounded-lg bg-muted p-1">
          {TABS.map((tab) => (
            <button
              key={tab.mode}
              type="button"
              aria-pressed={mode === tab.mode}
              disabled={busy}
              onClick={() => mode !== tab.mode && switchMode(tab.mode)}
              className="h-9 flex-1 rounded-md text-sm font-medium text-muted-foreground aria-pressed:bg-card aria-pressed:text-primary aria-pressed:shadow-sm"
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {linkFailed && (
        <p role="alert" className="rounded-lg bg-accent p-3 text-sm">
          Link đã hết hạn hoặc đã được dùng. Hãy đăng nhập lại hoặc yêu cầu link mới.
        </p>
      )}

      {GOOGLE_ENABLED && mode !== "forgot" && (
        <>
          {inApp ? (
            <InAppNotice />
          ) : (
            <Button type="button" variant="outline" className="h-11 w-full gap-2" onClick={google}>
              <span
                aria-hidden
                className="flex size-5 items-center justify-center rounded-full border text-xs font-bold"
              >
                G
              </span>
              Tiếp tục với Google
            </Button>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> hoặc <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <form className="space-y-4" onSubmit={submit}>
        <AuthField
          label={mode === "forgot" ? "Email đã đăng ký" : "Tên đăng nhập hoặc email"}
          name="username"
          type={mode === "forgot" ? "email" : "text"}
          inputMode={mode === "forgot" ? "email" : undefined}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          maxLength={254}
          value={account}
          error={accountError}
          onChange={(event) => {
            setAccount(event.target.value);
            setAccountError(undefined);
          }}
          hint={
            mode === "signup"
              ? "Email, hoặc tên 3–32 ký tự không dấu (chữ, số, dấu . _ -)."
              : undefined
          }
        />

        {mode === "signup" && typedUsername && (
          <div role="status" className="flex gap-2 rounded-lg border border-secondary bg-accent p-3 text-xs">
            <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              Dùng tên đăng nhập thì <strong>quên mật khẩu sẽ không lấy lại được</strong> tài khoản
              và thiệp. Muốn khôi phục được, hãy đăng ký bằng email.
            </p>
          </div>
        )}

        {mode !== "forgot" && (
          <PasswordField
            label="Mật khẩu"
            name="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            minLength={mode === "signup" ? MIN_PASSWORD : undefined}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            hint={
              mode === "signup" ? (
                <Rule met={password.length >= MIN_PASSWORD}>{`Ít nhất ${MIN_PASSWORD} ký tự`}</Rule>
              ) : undefined
            }
          />
        )}

        {mode === "signup" && (
          <PasswordField
            label="Nhập lại mật khẩu"
            name="password-confirm"
            autoComplete="new-password"
            required
            value={again}
            error={againError}
            onChange={(event) => {
              setAgain(event.target.value);
              setAgainError(undefined);
            }}
            hint={
              again ? <Rule met={again === password}>Khớp với mật khẩu trên</Rule> : undefined
            }
          />
        )}

        {mode === "login" && (
          <div className="-mt-2 text-right">
            <button
              type="button"
              onClick={() => switchMode("forgot")}
              className="min-h-8 text-sm text-primary underline-offset-4 hover:underline"
            >
              Quên mật khẩu?
            </button>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="rounded-lg bg-accent p-3 text-sm">
            {notice}
          </p>
        )}

        <Button type="submit" className="h-11 w-full text-base" disabled={busy}>
          {busy && <LoaderCircle aria-hidden className="animate-spin motion-reduce:animate-none" />}
          {busy ? heading.busy : heading.submit}
        </Button>
      </form>

      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        Khi tiếp tục, bạn đồng ý với{" "}
        <Link href="/chinh-sach-rieng-tu" className="underline underline-offset-2">
          chính sách riêng tư
        </Link>
        .<span className="lg:hidden"> Mỗi thiệp và mã QR hết hạn sau 60 ngày.</span>
      </p>
    </div>
  );
}
