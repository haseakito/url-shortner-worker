import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: {
        compatibilityDate: "2026-05-03",
        compatibilityFlags: ["nodejs_compat"],
        kvNamespaces: ["URL_SHORTENER"],
      },
    }),
  ],
  test: {
    include: ["src/**/*.test.ts"],
  },
});
