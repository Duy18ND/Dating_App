/**
 * Chuẩn hóa tài khoản đăng nhập cho Supabase Auth (không cần migration thêm).
 * Người dùng có thể nhập tên đăng nhập thường (vd: `duy18nd`) hoặc email thật.
 * Tên đăng nhập thường được ánh xạ nội bộ sang `@user.phygital.invalid` (yêu cầu tắt Confirm email trên Supabase).
 */
// Đuôi .invalid được RFC 2606 dành riêng: không ai đăng ký được, nên không ai nhận được email
// đặt lại mật khẩu của tài khoản tên đăng nhập. Đừng đổi sang tên miền thật mà mình không sở hữu.
export const INTERNAL_USER_DOMAIN = "user.phygital.invalid";
const INTERNAL_SUFFIX = `@${INTERNAL_USER_DOMAIN}`;
const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9._-]{1,30})[a-z0-9]$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

export type ParsedAccount =
  | { ok: true; kind: "username"; display: string; authEmail: string }
  | { ok: true; kind: "email"; display: string; authEmail: string }
  | { ok: false; error: string };

export function parseAccountIdentifier(raw: string): ParsedAccount {
  const normalized = raw.trim().toLowerCase();
  if (!normalized) {
    return { ok: false, error: "Hãy nhập tên đăng nhập hoặc email." };
  }

  if (normalized.includes("@")) {
    if (normalized.endsWith(INTERNAL_SUFFIX)) {
      return {
        ok: false,
        error: `Hãy nhập trực tiếp tên đăng nhập (không kèm ${INTERNAL_SUFFIX}).`,
      };
    }
    if (!EMAIL_PATTERN.test(normalized) || normalized.length > 254) {
      return { ok: false, error: "Email chưa đúng định dạng." };
    }
    return { ok: true, kind: "email", display: normalized, authEmail: normalized };
  }

  if (normalized.length < 3 || normalized.length > 32) {
    return { ok: false, error: "Tên đăng nhập cần từ 3 đến 32 ký tự." };
  }
  if (!USERNAME_PATTERN.test(normalized) || normalized.includes("..")) {
    return {
      ok: false,
      error: "Tên đăng nhập chỉ dùng chữ thường/in, số, dấu chấm, gạch ngang hoặc gạch dưới (không dấu, không khoảng trắng).",
    };
  }
  return {
    ok: true,
    kind: "username",
    display: normalized,
    authEmail: `${normalized}${INTERNAL_SUFFIX}`,
  };
}

/** Ẩn đuôi email nội bộ khi hiển thị lại tên tài khoản cho người dùng. */
export function formatAccountLabel(authEmail: string | null | undefined): string | undefined {
  if (!authEmail) return undefined;
  const lower = authEmail.toLowerCase();
  if (lower.endsWith(INTERNAL_SUFFIX)) {
    return authEmail.slice(0, authEmail.length - INTERNAL_SUFFIX.length);
  }
  return authEmail;
}

export const MIN_PASSWORD = 8;
export type AuthMode = "login" | "signup" | "forgot";

/**
 * Đổi lỗi của Supabase Auth thành câu cho người dùng. Không hướng dẫn cấu hình máy chủ,
 * và khi đăng nhập thì không cho biết tài khoản có tồn tại hay không (FR-14).
 */
export function authErrorMessage(
  message: string,
  mode: AuthMode,
  kind: "username" | "email",
): string {
  const text = message.toLowerCase();
  if (text.includes("chống spam")) return message;
  if (text.includes("captcha") || text.includes("turnstile")) {
    return "Xác thực chống spam thất bại, hãy thử lại.";
  }
  if (text.includes("rate limit") || text.includes("too many")) {
    return "Bạn thử quá nhiều lần, hãy đợi vài phút rồi thử lại.";
  }
  if (text.includes("failed to fetch") || text.includes("network")) {
    return "Mất kết nối, hãy kiểm tra mạng rồi thử lại.";
  }
  // Provider bị tắt hoặc khóa đăng ký: lỗi cấu hình, không phải do người dùng.
  if (/(logins|signups|provider).*(disabled|not enabled)|signups? not allowed/.test(text)) {
    return "Đăng nhập đang tạm tắt trên máy chủ. Vui lòng thử lại sau.";
  }
  if (mode === "signup" && text.includes("already")) {
    return kind === "username"
      ? "Tên đăng nhập này đã có người dùng, hãy chọn tên khác."
      : "Chưa tạo được tài khoản. Nếu bạn đã từng đăng ký, hãy đăng nhập hoặc đặt lại mật khẩu.";
  }
  if (mode === "signup" && text.includes("password")) {
    return `Mật khẩu cần ít nhất ${MIN_PASSWORD} ký tự và khó đoán hơn.`;
  }
  if (mode === "signup" && text.includes("invalid")) {
    return "Máy chủ không nhận tài khoản này. Hãy thử tên khác hoặc dùng email.";
  }
  if (text.includes("not confirmed")) {
    return "Tài khoản chưa được xác nhận. Hãy mở link trong email, kể cả mục Spam.";
  }
  return mode === "login"
    ? "Tên đăng nhập hoặc mật khẩu không đúng."
    : "Chưa thực hiện được, hãy thử lại sau ít phút.";
}
