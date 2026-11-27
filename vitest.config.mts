import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Trên Windows, chạy từ "d:\..." (chữ thường) khiến Vitest nạp trùng module.
// realpath.native trả về đúng chữ hoa của ổ đĩa.
const root = realpathSync.native(fileURLToPath(new URL(".", import.meta.url)));
process.chdir(root);

export default defineConfig({
  root,
  resolve: {
    alias: {
      "@": `${root}/src`,
      // "server-only" ném lỗi ngoài môi trường React Server; test thay bằng module rỗng.
      "server-only": `${root}/test/empty.ts`,
    },
  },
  test: { include: ["src/**/*.test.ts"] },
});
