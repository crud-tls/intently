// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Static site: Cloudflare serves dist/ as Worker assets, no server code.
export default defineConfig({
	site: "https://paceshift.liveintently.app",
	integrations: [sitemap()],
});
