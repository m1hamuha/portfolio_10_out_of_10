/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Build to /docs so GitHub Pages can serve from main -> /docs.
// base "./" keeps asset URLs relative for a project Pages site.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "docs",
    emptyOutDir: true,
  },
  test: {
    environment: "jsdom",
    coverage: {
      provider: "v8",
      include: [
        "src/generateReport.ts",
        "src/questions.ts",
        "src/presets.ts",
        "src/pdfExport.ts",
        "src/i18n.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
