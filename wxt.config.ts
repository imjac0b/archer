import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Archer",
    permissions: ["sidePanel", "tabs"],
  },
  vite(env) {
    return {
      ...env,
      plugins: [tailwindcss()],
    };
  },
});
