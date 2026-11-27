"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { CopyButton } from "@/components/share/CopyButton";
import { inputClass } from "@/components/editor/ui";
import { Button } from "@/components/ui/button";
import { getTurnstileToken } from "@/lib/client/turnstile";
import { parseAccountIdentifier } from "@/lib/auth-account";
import { isInAppBrowser } from "@/lib/in-app-browser";
import { safeNext } from "@/lib/safe-redirect";
import { authBrowser, callbackUrl } from "@/lib/supabase/browser";

type Mode = "login" | "signup" | "forgot";
const MIN_PASSWORD = 8;
const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

const TITLES: Record<Mode, string> = {
  login: "Đăng nhập",
  signup: "Tạo tài khoản",
  forgot: "Quên mật khẩu",
};

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
      <p className="font-medium">Bạn đang mở trong ứng dụng (Threads, Zalo, Messenger...)</p>
      <p>
        Google không cho đăng nhập ở đây. Hãy bấm nút ⋯ ở góc màn hình và chọn{" "}
        <strong>Mở bằng trình duyệt</strong> (Chrome hoặc Safari), hoặc sao chép link dưới đây
        rồi dán vào trình duyệt. Đăng nhập bằng tài khoản thường vẫn dùng được ngay tại đây.
      </p>
      <div className="flex items-center gap-2">
        <input className={inputClass} readOnly value={href} aria-label="Link trang đăng nhập" />
        <CopyButton value={href} />
      </div>
    </div>
  );
}

/** Lỗi đăng nhập không cho biết tài khoản email đã tồn tại hay chưa (FR-14). */
function friendly(message: string, mode: Mode, kind: "username" | "email"): string {
  const text = message.toLowerCase();
  if (text.includes("captcha")) return "Xác thực chống spam thất bại, hãy thử lại.";
  if (text.includes("rate limit") || text.includes("too many")) {
    return "Bạn thử quá nhiều lần, hãy đợi vài phút rồi thử lại.";
  }
  if (text.includes("password") && mode === "signup") {
    return `Mật khẩu cần ít nhất ${MIN_PASSWORD} ký tự và khó đoán hơn.`;
  }
  if (mode === "signup" && kind === "username" && text.includes("already")) {
    return "Tên đăng nhập này đã có người dùng, hãy chọn tên khác.";
  }
  if (text.includes("not confirmed")) {
    return "Tài khoản chưa được xác nhận. Hãy mở link trong email (nếu đăng ký bằng email) hoặc tắt Confirm email trên Supabase.";
  }
  return mode === "login"
    ? "Tên đăng nhập hoặc mật khẩu không đúng."
    : "Chưa thực hiện được, hãy thử lại sau ít phút.";
}

export function AuthForm() {
  const query = useSearchParams();
  const next = safeNext(query.get("next"));
  const linkFailed = query.get("loi") === "lien-ket";
  const inApp = useInAppBrowser();
  const [mode, setMode] = useState<Mode>(query.get("che-do") === "dang-ky" ? "signup" : "login");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();

  function switchMode(target: Mode) {
    setMode(target);
    setError(undefined);
    setNotice(undefined);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError(undefined);
    setNotice(undefined);

    const parsed = parseAccountIdentifier(account);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    if (mode === "forgot" && parsed.kind === "username") {
      setError("Tài khoản tên thường không có email khôi phục mật khẩu. Chỉ dùng được với email thật.");
      return;
    }

    setBusy(true);
    try {
      const supabase = authBrowser();
      const captchaToken = (await getTurnstileToken()) ?? undefined;
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.authEmail,
          password,
          options: { captchaToken },
        });
        if (error) throw error;
        // Tải trang mới để proxy và server đọc được cookie phiên vừa tạo.
        window.location.assign(next);
        return;
      }
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: parsed.authEmail,
          password,
          options: {
            ...(parsed.kind === "email" ? { emailRedirectTo: callbackUrl(next) } : {}),
            data: parsed.kind === "username" ? { username: parsed.display } : undefined,
            captchaToken,
          },
        });
        if (error) throw error;
        if (data.session) {
          // Khi Confirm email = OFF trên Supabase, đăng nhập thẳng ngay sau khi tạo tài khoản.
          window.location.assign(next);
          return;
        }
        if (parsed.kind === "username") {
          setNotice(
            "Đã tạo tài khoản nhưng Supabase đang bật xác nhận email. Hãy tắt Confirm email trong Supabase Auth rồi đăng nhập lại.",
          );
          return;
        }
        // Cùng một câu cho cả email đã có tài khoản: không lộ ai đã đăng ký.
        setNotice(
          "Nếu email hợp lệ, chúng tôi đã gửi link xác nhận. Mở hộp thư (kể cả mục Spam) và bấm link để bắt đầu.",
        );
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(parsed.authEmail, {
          redirectTo: callbackUrl("/doi-mat-khau"),
          captchaToken,
        });
        if (error) throw error;
        setNotice("Nếu email này có tài khoản, chúng tôi đã gửi link đặt lại mật khẩu.");
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "";
      setError(
        message.includes("NEXT_PUBLIC_SUPABASE")
          ? message
          : friendly(message, mode, parsed.kind),
      );
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError(undefined);
    const { error } = await authBrowser().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl(next) },
    });
    if (error) setError("Đăng nhập Google chưa được bật. Hãy dùng tài khoản thường.");
  }

  return (
    <div className="space-y-5">
      <h1 className="text-center font-playfair text-3xl text-primary">{TITLES[mode]}</h1>
      {linkFailed && (
        <p role="alert" className="rounded-md bg-accent p-3 text-sm">
          Link đã hết hạn hoặc đã được dùng. Hãy đăng nhập lại hoặc yêu cầu link mới.
        </p>
      )}

      {GOOGLE_ENABLED &&
        mode !== "forgot" &&
        (inApp ? (
          <InAppNotice />
        ) : (
          <>
            <Button type="button" variant="outline" className="w-full" onClick={google}>
              <ExternalLink /> Tiếp tục với Google
            </Button>
            <p className="text-center text-xs text-muted-foreground">hoặc dùng tài khoản</p>
          </>
        ))}

      <form className="space-y-3" onSubmit={submit}>
        <label className="block space-y-1">
          <span className="text-sm font-medium">
            {mode === "forgot" ? "Email đã đăng ký" : "Tên đăng nhập hoặc email"}
          </span>
          <input
            className={inputClass}
            type={mode === "forgot" ? "email" : "text"}
            autoComplete={mode === "forgot" ? "email" : "username"}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder={mode === "forgot" ? "ban@gmail.com" : "duy18nd hoặc ban@gmail.com"}
            required
            maxLength={254}
            value={account}
            onChange={(event) => setAccount(event.target.value)}
          />
          {mode === "signup" && (
            <span className="block text-xs text-muted-foreground">
              Gõ tên đăng nhập thường (3–32 ký tự chữ không dấu, số, `.`, `_`, `-`) hoặc email.
            </span>
          )}
        </label>
        {mode !== "forgot" && (
          <label className="block space-y-1">
            <span className="text-sm font-medium">
              Mật khẩu{mode === "signup" && ` (ít nhất ${MIN_PASSWORD} ký tự)`}
            </span>
            <input
              className={inputClass}
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={mode === "signup" ? MIN_PASSWORD : undefined}
              maxLength={72}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="rounded-md bg-accent p-3 text-sm">
            {notice}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy
            ? "Đang xử lý..."
            : mode === "login"
              ? "Đăng nhập"
              : mode === "signup"
                ? "Tạo tài khoản"
                : "Gửi link đặt lại mật khẩu"}
        </Button>
      </form>

      <div className="space-y-1 text-center text-sm">
        {mode === "login" && (
          <>
            <p>
              Chưa có tài khoản?{" "}
              <button type="button" className="text-primary underline" onClick={() => switchMode("signup")}>
                Tạo tài khoản
              </button>
            </p>
            <button type="button" className="text-muted-foreground underline" onClick={() => switchMode("forgot")}>
              Quên mật khẩu?
            </button>
          </>
        )}
        {mode !== "login" && (
          <button type="button" className="text-primary underline" onClick={() => switchMode("login")}>
            Quay lại đăng nhập
          </button>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Mỗi thiệp và mã QR trên thiệp giấy ngừng hoạt động sau 60 ngày. Đăng nhập là bạn đồng ý với{" "}
        <Link href="/chinh-sach-rieng-tu" className="underline">
          chính sách riêng tư
        </Link>
        . Người nhận thiệp không cần tài khoản.
      </p>
    </div>
  );
}
