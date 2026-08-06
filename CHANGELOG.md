# Changelog

All entries below are derived directly from `git log` on this repository (first commit: June 16, 2026; most recent: August 4, 2026). No version-tag scheme exists in the repo (`package.json` version is still `"0.0.0"`, and `git tag -l` returns nothing) — entries are grouped by development period and theme rather than invented version numbers. See the recommendation at the bottom.

## August 1–4, 2026 — Legal, Security & Final Polish

- Added full legal documentation set: Terms of Service, Privacy Policy, Cookie Policy, Acceptable Use Policy, Account Deletion Policy, EULA (`feat: add legal documentation and policies`)
- Added a `user_consents` table (RLS-protected) and server-side minimum-age (13+) enforcement via a database trigger, closing what the legal docs had flagged as a gap (`feat(auth): refactor legal policy handling and security`)
- Implemented account deletion via a Supabase Edge Function with two-layer JWT verification, plus avatar cleanup on deletion (`feat: improve avatar cleanup during account deletion`)
- Migrated remaining hardcoded Tailwind status colors (error/warning/success/neutral) to the CSS custom-property design-token system, fixing theme-inconsistent badge colors (`style: migrate hardcoded colors to CSS variables`)
- Removed remaining dev-only `console.log` calls and their guards from core logic (`refactor: remove verbose dev logs from core logic`)
- Documented verified project status in `TCS-01-design-manifesto.md`

## July 19–28, 2026 — Design System Overhaul

- Introduced the `EngineeredButton` component and the broader "Engineered Control" primitive family (buttons, rockers, LEDs, step meters, state cells, toggles)
- Unified UI colors under CSS custom-property theme variables and standardized theme colors using `color-mix`
- Built a custom 19-glyph SVG icon system, replacing emoji-based icons throughout the app
- Added animated logo and animated "Tempoit" wordmark branding
- Removed debug logs from auth handlers; general dependency and typing cleanup
- Integrated `react-router-dom` for real URL-based routing (replacing state-based tab switching) and added the Latte theme
- Removed unused Billing and AI Assistant settings tabs

## June 16–22, 2026 — Initial Build

- Initial project scaffold and structure
- Global user context and profile management (iterated through several refactors before settling on the current approach)
- Supabase Auth integration (sign up / sign in)
- Dynamic morning intentions feature, energy types, item/task types
- Sync status tracking added to `TasksContext`
- SPA routing and Supabase session persistence configured

---

## Recommendation

Since there's no existing version scheme to preserve, tagging the current `main` branch as **`v1.0.0`** once the action-plan items below are resolved would give a buyer a clean, unambiguous "this is the version you're acquiring" reference point — rather than an untagged, `0.0.0`-labeled commit history. This is a suggestion, not something already done.
