# Security Policy

## Reporting a Vulnerability

Email **contact@tempoit.me** (the same address already used across this project's Terms of Service, Privacy Policy, and EULA) with details. Please don't open a public GitHub issue for anything that could expose user data before it's fixed.

No formal response-time SLA exists yet — this is a small, actively-developed project, not a project with a dedicated security team.

## What's Actually in Place (Verified, Not Assumed)

Everything below was confirmed directly against the live database and source code, not inferred from file names or assumed from best-practice conventions.

### Row-Level Security
All four tables holding user data — `blocks`, `habits`, `habit_logs`, `daily_intentions` — have RLS **enabled** (`rowsecurity = true`, checked via `pg_tables`) with real per-user policies (checked via `pg_policies`, reading the actual `qual`/`with_check` clauses, not just policy names). Every policy condition is `auth.uid() = user_id`. A user cannot read or write another user's rows through the public API, including as an anonymous/unauthenticated caller — `auth.uid()` resolves to `null` for unauthenticated requests, and `null = user_id` is always false in Postgres.

### Authentication
Handled entirely by Supabase Auth (`signUp` / `signInWithPassword`). Session persistence and URL-based session detection are explicitly configured in `src/supabaseClient.js`.

### Age Verification
A client-side check exists at sign-up (13+ requirement), **and** a server-side enforcement trigger/function exists on the `profiles` table (`supabase/migrations/20260801_legal_consents_and_age_check.sql`) — so this isn't bypassable by skipping the client-side form.

### Account Deletion
Implemented via a Supabase Edge Function (`supabase/functions/delete-account/index.ts`), not just a client-side call. Verification is two-layered: Supabase's platform-level JWT check on the incoming request, plus an internal `adminClient.auth.getUser(token)` check inside the function itself before any deletion occurs. CORS is restricted to an explicit origin allowlist (localhost dev ports, `tempo.it`, `tempo.app`, and `*.vercel.app` / `*.run.app` wildcard patterns) rather than left open (`*`) — configurable via an `ALLOWED_ORIGINS` environment variable on the Supabase project.

### Credential Handling in Source
`src/supabaseClient.js` hardcodes the Supabase project URL and public (`sb_publishable_...`) key directly in source rather than reading them from environment variables.

- This is **not** a secret-exposure issue: this key is explicitly the public, client-safe key type (equivalent to the older JWT `anon` key), meant to ship in frontend bundles. Real access control comes entirely from the RLS policies above, not from keeping this string secret.
- It **is** worth fixing before a buyer handoff, for a different reason: a new owner can't point the app at their own Supabase project without editing source code. See the environment-variables recommendation in `README.md`.
- **Do not treat this as urgent from a data-exposure standpoint** — it isn't one, given RLS is confirmed correctly configured.

### No Sensitive Logging
No `console.log` statements exist anywhere in `src/` (confirmed by direct grep, zero matches). No auth tokens or session data are logged anywhere in the codebase.

## Known Gaps (Honest, Not Comprehensive)

- **No automated dependency vulnerability scanning** (e.g., Dependabot, `npm audit` in CI) currently runs — `npm audit` was run manually as part of this review; see the action plan for what it found.
- **No rate limiting** on the client side for auth attempts — this project relies entirely on whatever default protections Supabase Auth provides at the platform level; nothing custom is implemented in this codebase.
- **This document was not reviewed by a licensed security professional.** It reflects direct code and database inspection only, current as of August 4, 2026.
