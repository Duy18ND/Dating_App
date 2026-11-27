import "server-only";

/** Đọc biến môi trường lúc chạy request, để `next build` không cần khóa bí mật. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Thiếu biến môi trường ${name}`);
  return value;
}
