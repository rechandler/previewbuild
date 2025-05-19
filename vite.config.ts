import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const prNumber = process.env.PR_NUMBER;
let config;
if (!prNumber) {
  config = defineConfig({
    plugins: [react()],
  });
} else {
  config = defineConfig({
    plugins: [react()],
    base: `/previewbuild-pr-${prNumber}/`,
  });
}

export default config;
