#!/usr/bin/env node
// Google Search Console as an MCP server (stdio). Auth is a service-account JSON key whose email has
// been added as a user on the Search Console property. No Google client library: the token comes from
// a self-signed JWT (RS256) exchanged at oauth2.googleapis.com.
//
//   GSC_KEY_FILE   path to the key (default ~/.config/gsc/service-account.json)
//   GSC_SITE       default property (default sc-domain:liveintently.app)
//
// `node server.mjs --check` lists the properties the key can see and exits.
import { createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const KEY_FILE = process.env.GSC_KEY_FILE || join(homedir(), '.config/gsc/service-account.json');
const DEFAULT_SITE = process.env.GSC_SITE || 'sc-domain:liveintently.app';
const SCOPE = 'https://www.googleapis.com/auth/webmasters';

let cached = { token: null, exp: 0 };
async function accessToken() {
	if (cached.token && Date.now() < cached.exp - 60_000) return cached.token;
	let key;
	try { key = JSON.parse(readFileSync(KEY_FILE, 'utf8')); }
	catch (e) { throw new Error(`Cannot read the service-account key at ${KEY_FILE} (${e.code || e.message}). Set GSC_KEY_FILE.`); }
	const now = Math.floor(Date.now() / 1000);
	const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
	const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: key.client_email, scope: SCOPE, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`;
	const sig = createSign('RSA-SHA256').update(unsigned).sign(key.private_key).toString('base64url');
	const res = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${sig}` }),
	});
	const body = await res.json();
	if (!res.ok) throw new Error(`Token exchange failed: ${body.error_description || body.error || res.status}`);
	cached = { token: body.access_token, exp: Date.now() + body.expires_in * 1000 };
	return cached.token;
}

async function api(method, url, body) {
	const res = await fetch(url, {
		method,
		headers: { authorization: `Bearer ${await accessToken()}`, ...(body ? { 'content-type': 'application/json' } : {}) },
		body: body ? JSON.stringify(body) : undefined,
	});
	const text = await res.text();
	const data = text ? JSON.parse(text) : {};
	if (!res.ok) {
		const msg = data.error?.message || res.statusText;
		const hint = res.status === 403 ? ' (add the service account email as a user on this property in Search Console)' : '';
		throw new Error(`${method} ${url} -> ${res.status}: ${msg}${hint}`);
	}
	return data;
}

const WM = 'https://www.googleapis.com/webmasters/v3';
const site = (s) => encodeURIComponent(s || DEFAULT_SITE);
const isoDay = (offset) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);

const TOOLS = [
	{
		name: 'gsc_list_sites',
		description: 'List the Search Console properties the service account can access, with its permission level.',
		inputSchema: { type: 'object', properties: {} },
		run: async () => (await api('GET', `${WM}/sites`)).siteEntry ?? [],
	},
	{
		name: 'gsc_search_analytics',
		description: 'Query Search Console performance data (clicks, impressions, CTR, position). Data lags about 2-3 days. ' +
			'Group by any of date, query, page, country, device, searchAppearance. Filter with e.g. {"dimension":"page","operator":"contains","expression":"respite."}.',
		inputSchema: {
			type: 'object',
			properties: {
				siteUrl: { type: 'string', description: `Property, default ${DEFAULT_SITE}` },
				startDate: { type: 'string', description: 'YYYY-MM-DD, default 28 days ago' },
				endDate: { type: 'string', description: 'YYYY-MM-DD, default 2 days ago' },
				dimensions: { type: 'array', items: { type: 'string', enum: ['date', 'query', 'page', 'country', 'device', 'searchAppearance'] } },
				filters: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							dimension: { type: 'string' },
							operator: { type: 'string', enum: ['contains', 'equals', 'notContains', 'notEquals', 'includingRegex', 'excludingRegex'] },
							expression: { type: 'string' },
						},
						required: ['dimension', 'expression'],
					},
				},
				type: { type: 'string', enum: ['web', 'image', 'video', 'news', 'discover', 'googleNews'], description: 'default web' },
				rowLimit: { type: 'number', description: '1-25000, default 100' },
				startRow: { type: 'number' },
				orderBy: { type: 'string', enum: ['clicks', 'impressions', 'ctr', 'position'], description: 'Client-side sort, descending (position ascending). Default: as returned.' },
			},
		},
		run: async (a) => {
			const body = {
				startDate: a.startDate || isoDay(-28),
				endDate: a.endDate || isoDay(-2),
				dimensions: a.dimensions || [],
				type: a.type || 'web',
				rowLimit: Math.min(a.rowLimit || 100, 25000),
				startRow: a.startRow || 0,
				dataState: 'all',
			};
			if (a.filters?.length) body.dimensionFilterGroups = [{ filters: a.filters.map((f) => ({ operator: 'contains', ...f })) }];
			const data = await api('POST', `${WM}/sites/${site(a.siteUrl)}/searchAnalytics/query`, body);
			let rows = (data.rows || []).map((r) => ({
				...Object.fromEntries((body.dimensions).map((d, i) => [d, r.keys[i]])),
				clicks: r.clicks, impressions: r.impressions, ctr: +(r.ctr * 100).toFixed(2), position: +r.position.toFixed(1),
			}));
			if (a.orderBy) rows.sort((x, y) => (a.orderBy === 'position' ? x.position - y.position : y[a.orderBy] - x[a.orderBy]));
			return { request: body, rowCount: rows.length, rows };
		},
	},
	{
		name: 'gsc_inspect_url',
		description: "Google's index status for one URL: coverage, last crawl, the canonical Google chose, mobile usability, rich results.",
		inputSchema: {
			type: 'object',
			properties: { url: { type: 'string' }, siteUrl: { type: 'string', description: `default ${DEFAULT_SITE}` } },
			required: ['url'],
		},
		run: async (a) => (await api('POST', 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
			{ inspectionUrl: a.url, siteUrl: a.siteUrl || DEFAULT_SITE, languageCode: 'en-US' })).inspectionResult,
	},
	{
		name: 'gsc_list_sitemaps',
		description: 'List sitemaps submitted for the property, with last download, errors, warnings and URL counts.',
		inputSchema: { type: 'object', properties: { siteUrl: { type: 'string' } } },
		run: async (a) => (await api('GET', `${WM}/sites/${site(a.siteUrl)}/sitemaps`)).sitemap ?? [],
	},
	{
		name: 'gsc_submit_sitemap',
		description: 'Submit (or resubmit) a sitemap URL for the property. Needs Full or Owner permission.',
		inputSchema: {
			type: 'object',
			properties: { sitemapUrl: { type: 'string' }, siteUrl: { type: 'string' } },
			required: ['sitemapUrl'],
		},
		run: async (a) => {
			await api('PUT', `${WM}/sites/${site(a.siteUrl)}/sitemaps/${encodeURIComponent(a.sitemapUrl)}`);
			return { submitted: a.sitemapUrl };
		},
	},
];

if (process.argv.includes('--check')) {
	const sites = await TOOLS[0].run({});
	console.log(JSON.stringify(sites, null, 2));
	process.exit(0);
}

const server = new Server({ name: 'gsc', version: '1.0.0' }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({
	tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
}));
server.setRequestHandler(CallToolRequestSchema, async (req) => {
	const tool = TOOLS.find((t) => t.name === req.params.name);
	if (!tool) return { isError: true, content: [{ type: 'text', text: `Unknown tool ${req.params.name}` }] };
	try {
		return { content: [{ type: 'text', text: JSON.stringify(await tool.run(req.params.arguments || {}), null, 1) }] };
	} catch (e) {
		return { isError: true, content: [{ type: 'text', text: e.message }] };
	}
});
await server.connect(new StdioServerTransport());
