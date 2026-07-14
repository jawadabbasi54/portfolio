import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://jawadabbasi.com",
  output: "static",
  trailingSlash: "never",
  integrations: [sitemap({
    filter: (page) => page !== "https://jawadabbasi.com/404/",
  })],
  build: {
    inlineStylesheets: "auto",
  },
});
