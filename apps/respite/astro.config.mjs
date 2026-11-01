// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

import cloudflare from "@astrojs/cloudflare";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { readdirSync, readFileSync } from "node:fs";

// npm workspaces hoist dependencies to the repo root, so find lucide's icons wherever npm put them.
const lucideIcons = join(dirname(createRequire(import.meta.url).resolve("lucide-static/package.json")), "icons");

// The sitemap's lastmod for each post is its real updatedDate (or pubDate). Other pages carry none:
// stamping every URL with the build time teaches Google to ignore lastmod altogether.
const blogDir = new URL("./src/content/blog/", import.meta.url);
const postDates = Object.fromEntries(
	readdirSync(blogDir)
		.filter((f) => /\.mdx?$/.test(f))
		.map((f) => {
			const fm = readFileSync(new URL(f, blogDir), "utf8").split("---")[1] ?? "";
			const date = (key) => fm.match(new RegExp(`^${key}:\\s*['"]?([0-9-]+)`, "m"))?.[1];
			return [f.replace(/\.mdx?$/, ""), date("updatedDate") ?? date("pubDate")];
		})
		.filter(([, d]) => d),
);

// https://astro.build/config
export default defineConfig({
	vite: {
		resolve: { alias: { "@lucide-icons": lucideIcons } },
	},
	site: "https://respite.liveintently.app",
	image: {
		domains: ["respite.liveintently.app"],
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
			// Noindex pages (account deletion) and the 404 page don't belong in the sitemap.
			filter: (page) => !/\/(delete-account|404)(\/|$)/.test(new URL(page).pathname),
			serialize(item) {
				const slug = item.url.match(/\/blog\/([^/]+)\/$/)?.[1];
				if (slug && postDates[slug]) item.lastmod = new Date(postDates[slug]).toISOString();
				// Higher priority for important pages
				if (item.url === 'https://respite.liveintently.app/') {
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
