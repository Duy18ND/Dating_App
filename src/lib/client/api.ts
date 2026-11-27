import type { ResponseInput } from "@/lib/validation";
import type { LetterPayload, LetterSummary, ManagedLetter } from "@/types/letter";
import { getTurnstileToken } from "./turnstile";

/** Phiên đăng nhập hết hạn hoặc chưa đăng nhập: giao diện nên đưa người dùng tới /dang-nhap. */
export class AuthRequiredError extends Error {}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: "same-origin", ...init }).catch(() => {
    throw new Error("Mất kết nối, hãy kiểm tra mạng rồi thử lại.");
  });
  const body = await response.json().catch(() => ({}));
  if (response.status === 401) {
    throw new AuthRequiredError(body.error ?? "Bạn cần đăng nhập để làm việc này");
  }
  if (!response.ok) throw new Error(body.error ?? "Có lỗi xảy ra, vui lòng thử lại.");
  return body as T;
}

async function protectedHeaders(): Promise<Record<string, string>> {
  const token = await getTurnstileToken();
  return token ? { "x-turnstile-token": token } : {};
}

const jsonInit = (method: string, body: unknown, headers: Record<string, string> = {}) => ({
  method,
  headers: { "Content-Type": "application/json", ...headers },
  body: JSON.stringify(body),
});

export async function uploadImage(blob: Blob): Promise<string> {
  const form = new FormData();
  form.set("file", new File([blob], "image.webp", { type: "image/webp" }));
  const { url } = await request<{ url: string }>("/api/upload", {
    method: "POST",
    headers: await protectedHeaders(),
    body: form,
  });
  return url;
}

export async function createLetter(payload: LetterPayload) {
  return request<{ id: string; slug: string }>(
    "/api/letters",
    jsonInit("POST", payload, await protectedHeaders()),
  );
}

const myLetter = (id: string) => `/api/me/letters/${encodeURIComponent(id)}`;

export const updateLetter = (id: string, payload: LetterPayload) =>
  request<{ id: string; slug: string }>(myLetter(id), jsonInit("PATCH", payload));

export const getMyLetter = (id: string) => request<ManagedLetter>(myLetter(id));

export const listMyLetters = () => request<LetterSummary[]>("/api/me/letters");

export const deleteMyLetter = (id: string) =>
  request<{ ok: true }>(myLetter(id), { method: "DELETE" });

/** `confirm` phải đúng chuỗi DELETE_ACCOUNT_CONFIRM của API. */
export const deleteAccount = (confirm: string) =>
  request<{ ok: true }>("/api/me/account", jsonInit("DELETE", { confirm }));

export const sendResponse = (slug: string, input: ResponseInput) =>
  request<{ ok: true }>(`/api/letters/${slug}/responses`, jsonInit("POST", input));

/** Ghi nhận lượt mở. Lỗi ở đây không được làm hỏng trải nghiệm người nhận. */
export const recordView = (slug: string) =>
  void fetch(`/api/letters/${slug}/view`, { method: "POST", keepalive: true }).catch(() => {});
