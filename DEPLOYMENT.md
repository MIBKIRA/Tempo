# Deployment

## What This Actually Is

A static single-page app. `npm run build` outputs plain HTML/CSS/JS to `dist/` — no server process, no API routes, nothing that needs a Node runtime in production. It can be hosted on any static host.

**No CI/CD pipeline exists in this repository** (no `.github/workflows/`, no other CI config found). All builds and deploys documented here are manual until one is set up.

## Pre-Configured Platforms

Two platforms have working SPA-routing config already committed to this repo — confirmed by reading both files directly:

### Vercel
`vercel.json` (repo root) already contains the rewrite rule needed for client-side routing:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
Deploy: connect the GitHub repo in the Vercel dashboard, or `vercel --prod` from the CLI. Build command `npm run build`, output directory `dist` (Vercel auto-detects this for Vite projects; no override needed).

### Netlify
`public/_redirects` already contains the equivalent rule:
```
/* /index.html 200
```
Deploy: connect the repo in the Netlify dashboard, or `netlify deploy --prod`. Build command `npm run build`, publish directory `dist`.

**Both configs can coexist** — this is not a conflict. Having both means the project deploys correctly to either platform with zero additional setup, whichever the new owner prefers.

### Other Static Hosts (Cloudflare Pages, GitHub Pages, S3+CloudFront, etc.)
Not pre-configured, but would work the same way: build with `npm run build`, serve `dist/`, and add an equivalent "rewrite everything to `/index.html`" rule for the platform in question (required for any client-side-routed SPA — without it, refreshing on a non-root URL like `/settings` returns a 404 from the host instead of loading the app).

## Supabase Side

The Supabase project itself (Postgres database, Auth, the `delete-account` Edge Function) is deployed and managed separately from the frontend, via the Supabase dashboard/CLI — not part of this repo's build/deploy process. See `BUYER_HANDOFF.md` for what needs to transfer.

The Edge Function's comment header documents its own deploy command:
```bash
supabase functions deploy delete-account
```
It also requires `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_URL` to be set as Supabase project secrets (not repo secrets) for the function to work — these are configured on the Supabase side, not in this codebase.

## Environment Variables at Deploy Time

None required today — see `README.md`'s Environment Variables section for why (Supabase config is currently hardcoded in source, not read from env vars). If that's changed per the recommendation in the action plan, `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLIC_KEY` would need to be set in whichever platform's dashboard is used (Vercel/Netlify project settings), since Vite only inlines `VITE_`-prefixed variables at build time.

## Domains Referenced in Code

The Edge Function's CORS allowlist (`getCorsHeaders` in `supabase/functions/delete-account/index.ts`) references `https://tempo.it` and `https://tempo.app` as allowed origins, alongside `*.vercel.app` and `*.run.app` wildcard patterns. **This confirms these domains are configured as intended origins in code — it does not confirm either domain is currently registered, live, or pointed at this project.** Verify domain ownership/DNS separately before relying on this for a live deployment.
