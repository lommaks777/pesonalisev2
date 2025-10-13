import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vitest/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./test/setupTests.ts"],
    include: ["test/**/*.test.{ts,tsx}"],
    css: true,
    reporters: process.env.CI ? ["default", "junit"] : ["default"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
});

