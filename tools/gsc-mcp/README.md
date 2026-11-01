# gsc-mcp

A small local MCP server so Claude Code can read Google Search Console directly: search analytics,
URL inspection, and sitemaps. One file, one dependency, a service-account key for auth.

## Setup (once)

1. Google Cloud console: pick or create a project, enable **Google Search Console API**.
2. IAM & Admin → Service Accounts → Create (`gsc-reader`, no roles) → Keys → Add key → JSON.
   Save it as `~/.config/gsc/service-account.json` (`chmod 600`). Never commit it.
3. Search Console → property `liveintently.app` → Settings → Users and permissions → Add user:
   the service account's `…@….iam.gserviceaccount.com` email, permission **Full** (needed to submit sitemaps).
4. `cd tools/gsc-mcp && npm install && npm run check` lists the properties it can see.
5. Register it with Claude Code (user scope, so every project sees it):

   ```sh
   claude mcp add gsc --scope user -- node /Users/faddy/MyLab/WellbeingApps/intently/tools/gsc-mcp/server.mjs
   ```

Environment: `GSC_KEY_FILE` (key path), `GSC_SITE` (default property, `sc-domain:liveintently.app`).

## Tools

| Tool | What |
|---|---|
| `gsc_list_sites` | Properties and permission level |
| `gsc_search_analytics` | Clicks, impressions, CTR, position by date/query/page/country/device, with filters |
| `gsc_inspect_url` | Index status, last crawl, Google-chosen canonical |
| `gsc_list_sitemaps` | Submitted sitemaps and their status |
| `gsc_submit_sitemap` | Submit or resubmit a sitemap |
