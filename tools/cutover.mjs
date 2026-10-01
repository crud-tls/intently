// Moves liveintently.app hostnames onto their new Workers (Workers Custom Domains API).
//   node tools/cutover.mjs                      # dry run: shows the plan and current owners
//   node tools/cutover.mjs --apply --step=apps  # then --step=hub, --step=redirects
// Steps run in this order so no URL is ever dead: app subdomains (new or taken from the old
// "intently" Worker), then the apex (the switch from the old site to the hub), then redirects.
import { APPS, STUDIO } from '../packages/registry/src/apps.ts';
import { HOSTS as REDIRECT_HOSTS } from '../apps/redirects/src/index.ts';
import { readFileSync, writeFileSync } from 'node:fs';

// Once a hostname is attached, its Worker's wrangler.json lists it too, so later deploys keep it.
const configFor = (service) => new URL(`../apps/${service === 'intently-hub' ? 'hub' : service === 'intently-redirects' ? 'redirects' : service.replace(/-site$/, '')}/wrangler.json`, import.meta.url);
const recordRoute = (service, hostname) => {
	const file = configFor(service);
	const config = JSON.parse(readFileSync(file, 'utf8'));
	config.routes = config.routes ?? [];
	if (!config.routes.some((r) => r.pattern === hostname)) config.routes.push({ pattern: hostname, custom_domain: true });
	writeFileSync(file, JSON.stringify(config, null, 2) + '\n');
};

const token = process.env.CLOUDFLARE_API_TOKEN;
if (!token) throw new Error('CLOUDFLARE_API_TOKEN is not set');
const API = 'https://api.cloudflare.com/client/v4';
const call = async (path, init = {}) => {
	const res = await fetch(API + path, { ...init, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
	const body = await res.json();
	if (!body.success) throw new Error(`${init.method ?? 'GET'} ${path}: ${JSON.stringify(body.errors)}`);
	return body.result;
};

const [zone] = await call(`/zones?name=${STUDIO.host}`);
const account = zone.account.id;
const current = Object.fromEntries((await call(`/accounts/${account}/workers/domains`)).map((d) => [d.hostname, d.service]));

const STEPS = {
	apps: APPS.map((a) => [a.host, `${a.id}-site`]),
	hub: [[STUDIO.host, 'intently-hub']],
	redirects: REDIRECT_HOSTS.map((h) => [h, 'intently-redirects']),
};

const apply = process.argv.includes('--apply');
const only = process.argv.find((a) => a.startsWith('--step='))?.split('=')[1];
if (apply && !only) throw new Error('--apply needs --step=apps|hub|redirects (one at a time)');

for (const [step, pairs] of Object.entries(STEPS)) {
	if (only && step !== only) continue;
	console.log(`\n# ${step}`);
	for (const [hostname, service] of pairs) {
		const was = current[hostname] ?? '(none)';
		const todo = was === service ? 'ok' : `${was} -> ${service}`;
		console.log(`${hostname.padEnd(30)} ${todo}`);
		if (apply && was !== service) {
			await call(`/accounts/${account}/workers/domains`, {
				method: 'PUT',
				// Taking a hostname from another Worker (the old site) has to be explicit.
				body: JSON.stringify({ hostname, service, zone_id: zone.id, environment: 'production', override_existing_origin: was !== '(none)' }),
			});
			console.log(`  attached`);
		}
		if (apply) recordRoute(service, hostname);
	}
}
if (!apply) console.log('\nDry run. Re-run with --apply --step=<name> to make changes.');
