import tailwindcss from "@tailwindcss/vite";
import { ConfigEnv, defineConfig, WxtViteConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-svelte"],
  manifest: {
    permissions: ["downloads"],
  },
  svelte: {
    vite: {
      compilerOptions: {
        runes: true,
      },
    },
  },
  vite: (env: ConfigEnv): WxtViteConfig => ({
    plugins: [tailwindcss()],
  }),
});
