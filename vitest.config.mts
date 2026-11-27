import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const path = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path("./src"),
      // "server-only" ném lỗi ngoài môi trường React Server; test thay bằng module rỗng.
      "server-only": path("./test/empty.ts"),
    },
  },
  test: { include: ["src/**/*.test.ts"] },
});
