import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  publicDir: false,
  build: {
    rollupOptions: { input: "menu.html" },
    outDir: ".web-build",
    emptyOutDir: true,
    assetsDir: "assets/web",
    target: "es2022",
  },
});
