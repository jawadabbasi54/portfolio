import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://jawadabbasi.com",
  output: "static",
  integrations: [sitemap()],
  build: {
    inlineStylesheets: "auto",
  },
});
