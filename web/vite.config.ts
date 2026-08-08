import { defineConfig } from "vite";

// Served from https://<user>.github.io/Jaipur/ by the GitHub Pages workflow,
// so asset URLs need the repo name as a base path. Override with
// VITE_BASE_PATH if you deploy somewhere else (custom domain, Firebase
// Hosting at the root, etc).
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? "/Jaipur/",
  build: {
    outDir: "dist",
    sourcemap: true
  }
});
