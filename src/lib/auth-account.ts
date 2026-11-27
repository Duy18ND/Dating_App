/**
 * Chuẩn hóa tài khoản đăng nhập cho Supabase Auth (không cần migration thêm).
 * Người dùng có thể nhập tên đăng nhập thường (vd: `duy18nd`) hoặc email thật.
 * Tên đăng nhập thường được ánh xạ nội bộ sang `@user.phygital.app` (yêu cầu tắt Confirm email trên Supabase).
 */
export const INTERNAL_USER_DOMAIN = "user.phygital.app";
const INTERNAL_SUFFIX = `@${INTERNAL_USER_DOMAIN}`;
const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9._-]{1,30})[a-z0-9]$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
