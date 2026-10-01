// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

import cloudflare from "@astrojs/cloudflare";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

// npm workspaces hoist dependencies to the repo root, so find lucide's icons wherever npm put them.
const lucideIcons = join(dirname(createRequire(import.meta.url).resolve("lucide-static/package.json")), "icons");

// https://astro.build/config
export default defineConfig({
	vite: {
		resolve: { alias: { "@lucide-icons": lucideIcons } },
	},
	site: "https://pawse.liveintently.app",
	image: {
		domains: ["pawse.liveintently.app"],
		formats: ["avif", "webp"],
		service: {
			entrypoint: "astro/assets/services/sharp",
		},
	},
	integrations: [
		mdx(),
		sitemap({
			changefreq: 'weekly',
			priority: 0.7,
			lastmod: new Date(),
			serialize(item) {
				// Higher priority for important pages
				if (item.url === 'https://pawse.liveintently.app/') {
					item.priority = 1.0;
					item.changefreq = 'daily';
				} else if (
					item.url.includes('/features') ||
					item.url.includes('/download') ||
					item.url.includes('/quiz') ||
					item.url.includes('/compare')
				) {
					item.priority = 0.9;
					item.changefreq = 'weekly';
				} else if (item.url.includes('/blog/')) {
					item.priority = 0.8;
					item.changefreq = 'weekly';
				} else if (
					item.url.includes('/privacy') ||
					item.url.includes('/terms') ||
					item.url.includes('/about')
				) {
					item.priority = 0.7;
					item.changefreq = 'monthly';
				}
				return item;
			},
		}),
	],
	adapter: cloudflare({
		platformProxy: {
			enabled: true,
		},
	}),
});
