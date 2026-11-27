import type { ResponseInput } from "@/lib/validation";
import type { LetterPayload, ManagedLetter } from "@/types/letter";
import { getTurnstileToken } from "./turnstile";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init).catch(() => {
    throw new Error("Mất kết nối, hãy kiểm tra mạng rồi thử lại.");
  });
  const body = await response.json().catch(() => ({}));
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
  return request<{ slug: string; edit_token: string }>(
    "/api/letters",
    jsonInit("POST", payload, await protectedHeaders()),
  );
}

export const updateLetter = (slug: string, editToken: string, payload: LetterPayload) =>
  request<{ slug: string }>(
    `/api/letters/${slug}`,
    jsonInit("PATCH", payload, { "x-edit-token": editToken }),
  );

export const getManagedLetter = (editToken: string) =>
  request<ManagedLetter>(`/api/manage/${encodeURIComponent(editToken)}`);

export const sendResponse = (slug: string, input: ResponseInput) =>
  request<{ ok: true }>(`/api/letters/${slug}/responses`, jsonInit("POST", input));

/** Ghi nhận lượt mở. Lỗi ở đây không được làm hỏng trải nghiệm người nhận. */
export const recordView = (slug: string) =>
  void fetch(`/api/letters/${slug}/view`, { method: "POST", keepalive: true }).catch(() => {});
