/**
 * End-to-end tests for the hub, against the built Worker (wrangler dev serves the real _redirects
 * and static assets). Run: npm run test:e2e -w @intently/hub-site
 * Devices: desktop Chrome and Safari, an Android phone, an iPhone and an iPad.
 */
import { defineConfig, devices } from '@playwright/test';

const PORT = 8790;

export default defineConfig({
	testDir: './tests/e2e',
	timeout: 60_000,
	expect: { timeout: 10_000 },
	fullyParallel: true,
	// The live world renders in software in headless browsers: more workers starve each other.
	workers: 2,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? 'github' : [['list']],
	use: {
		baseURL: `http://127.0.0.1:${PORT}`,
		trace: 'retain-on-failure',
	},
	webServer: {
		command: `npm run build && npx wrangler dev --port ${PORT} --ip 127.0.0.1 --log-level error`,
		url: `http://127.0.0.1:${PORT}/`,
		reuseExistingServer: !process.env.CI,
		timeout: 180_000,
	},
	projects: [
		{
			name: 'desktop-chrome',
			use: {
				...devices['Desktop Chrome'],
				viewport: { width: 1440, height: 900 },
				// WebGL on machines without a GPU (CI) needs SwiftShader allowed explicitly.
				launchOptions: { args: ['--enable-unsafe-swiftshader'] },
			},
		},
		{ name: 'desktop-safari', use: { ...devices['Desktop Safari'], viewport: { width: 1280, height: 800 } } },
		{ name: 'android', use: { ...devices['Pixel 7'], launchOptions: { args: ['--enable-unsafe-swiftshader'] } } },
		{ name: 'iphone', use: { ...devices['iPhone 14'] } },
		{ name: 'ipad', use: { ...devices['iPad (gen 7)'] } },
	],
});
