// Scaffolds apps/<id> from templates/app for an app already listed in packages/registry.
//   node tools/create-app.mjs <id> [--accounts]
// Legal pages are added only when packages/legal/policies/<id>/ has them; --accounts adds the
// account-deletion page (fill in content.accountDeletion). Then write src/content.ts.
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { app } from '../packages/registry/src/apps.ts';

const [id] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const accounts = process.argv.includes('--accounts');
if (!id) throw new Error('usage: node tools/create-app.mjs <id> [--accounts]');

const root = new URL('..', import.meta.url).pathname;
const a = app(id);
const dest = join(root, 'apps', id);
if (existsSync(dest)) throw new Error(`apps/${id} already exists`);

const policies = join(root, 'packages', 'legal', 'policies', id);
const hasPrivacy = existsSync(join(policies, 'privacy.md'));
const hasTerms = existsSync(join(policies, 'terms.md'));
const hub = JSON.parse(readFileSync(join(root, 'apps', 'hub', 'package.json'), 'utf8'));

const vars = {
	ID: id, NAME: a.name, HOST: a.host, TAGLINE: a.tagline.replace(/'/g, "\\'"),
	HAS_PRIVACY: String(hasPrivacy), HAS_TERMS: String(hasTerms),
	ASTRO: hub.dependencies.astro, TS: hub.dependencies.typescript,
	SITEMAP: hub.dependencies['@astrojs/sitemap'], WRANGLER: hub.devDependencies.wrangler,
};

cpSync(join(root, 'templates', 'app'), dest, { recursive: true });
const fill = (dir) => {
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		if (statSync(p).isDirectory()) fill(p);
		else writeFileSync(p, readFileSync(p, 'utf8').replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`));
	}
};
fill(dest);
if (!hasPrivacy) rmSync(join(dest, 'src/pages/privacy.astro'));
if (!hasTerms) rmSync(join(dest, 'src/pages/terms.astro'));
if (!accounts) rmSync(join(dest, 'src/pages/delete-account.astro'));

// The app's icon (as listed in the registry) or a monogram in its colour doubles as the favicon.
const hubIcon = a.icon && join(root, 'apps', 'hub', 'public', a.icon);
if (hubIcon && existsSync(hubIcon)) {
	cpSync(hubIcon, join(dest, 'public', a.icon));
	cpSync(hubIcon, join(dest, 'public', 'favicon.svg'));
} else {
	writeFileSync(join(dest, 'public', 'favicon.svg'),
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${a.color}"/>` +
		`<text x="32" y="44" font-family="system-ui,sans-serif" font-size="34" font-weight="800" text-anchor="middle" fill="#fff">${a.name[0]}</text></svg>\n`);
}
console.log(`apps/${id} created (privacy: ${hasPrivacy}, terms: ${hasTerms}, accounts: ${accounts}). Now write src/content.ts, then npm install.`);
