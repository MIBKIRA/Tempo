# Buyer Handoff Checklist

What actually needs to change hands for a new owner to run and continue developing this project, based only on dependencies verified in this codebase — not a generic acquisition template.

## Must Transfer

- [ ] **GitHub repository** — `github.com/MIBKIRA/Tempo`. Either transfer ownership directly (GitHub Settings → Transfer ownership) or add the buyer as owner and remove yourself after payment clears — standard practice, decide based on your Acquire.com deal structure.
- [ ] **Supabase project** — this is the entire backend. The project referenced in `src/supabaseClient.js` (`vrqdyyonogcuffxyhprg.supabase.co`) needs to either:
  - Transfer to the buyer's Supabase organization (Supabase supports project transfer between orgs), **or**
  - Be recreated by the buyer from the migration files in `supabase/migrations/` + a schema/data export, if you're not transferring the live project itself.
  - Either way, the buyer needs the **actual production data** (existing users' tasks/habits/accounts), not just the schema, unless you've agreed the sale is code-only with no live users.
- [ ] **Domain(s), if live** — only if `tempo.it` and/or `tempo.app` (referenced in the Edge Function's CORS allowlist) are actually registered and pointed at a live deployment. Confirm this yourself; it was not verified as part of this audit — see the note in `DEPLOYMENT.md`.
- [ ] **Deployment platform account** — whichever of Vercel/Netlify (or another host) currently serves the live app, if one exists. Transfer the project within that platform, or have the buyer redeploy from the repo using `DEPLOYMENT.md`.

## Should Transfer / Discuss

- [ ] **`contact@tempoit.me` email/inbox** — used throughout the legal documents (Terms, Privacy Policy, EULA) as the official contact address. If the buyer will operate under this same brand/domain, this needs to transfer too, or every legal document needs updating to a new address before/at handoff.
- [ ] **Any Google Fonts / third-party accounts** — none found requiring API keys (Google Fonts is loaded via public CDN `@import`, no account needed) — nothing to transfer here, noted for completeness.

## Nothing Else Found

No other third-party services, paid APIs, analytics accounts, or infrastructure were found anywhere in this codebase (see `ARCHITECTURE.md` → External Dependencies). This is a short list because the actual dependency surface is short — Supabase and a domain (if live) are the whole backend footprint.

## Before Handoff — Recommended (See Main Action Plan)

- [ ] Resolve the `[Company Name / Legal Entity]` placeholder across `legal/*.md` — affects who the buyer is legally contracting with via the Terms/EULA/Privacy Policy they're inheriting.
- [ ] Decide and add a `LICENSE` file (or explicit proprietary notice) per `LICENSE-recommendation.md`, so ownership terms are unambiguous the moment the repo changes hands.
- [ ] Consider rotating the Supabase service role key (used by the Edge Function) after transfer, as a standard precaution when a project changes hands — not because anything found here indicates it was compromised.

## Remaining Uncertainty

This checklist is built entirely from what's referenced *inside the codebase*. It cannot account for anything that exists only outside it — e.g., a Google Analytics property, a Stripe account, a support ticketing tool, or any other external system if one exists but was never wired into the code. Confirm with your own records whether anything outside this repository is part of what you're actually selling.
