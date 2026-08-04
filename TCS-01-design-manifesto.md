# TCS-01 — Tempo Design System Manifesto

**Last updated:** August 4, 2026

**Status legend:** ✅ = independently verified this session (re-cloned repo,
ran `tsc --noEmit` / `npm run build` / direct grep or SQL checks) · 🔶 =
completed in an earlier session, not re-verified in this pass.

## Status Table

| Phase | Description | Status |
|-------|--------------|--------|
| 1–10 | Design system buildout (Engineered Control components, 19-glyph icon system, animated "Ti" logo, animated wordmark, token system, Latte theme, full palette redesign) | 🔶 Complete |
| 11 | `console.log` cleanup | ✅ Complete |
| 12 | Unused dependency removal (`@google/genai`, `express`, `dotenv`) | ✅ Complete |
| 13 | TypeScript `any` elimination | ✅ Complete |
| 14 | Real URL routing via `react-router-dom` | ✅ Complete |
| 15 | Hardcoded color → design token replacement | ✅ Complete |
| — | Row-Level Security (RLS) on core tables | ✅ Verified secure |

## Phases 1–10 (carried from project history, not re-verified this pass)

- Custom "Engineered Control" button system: flat hard-edged offset plate
  shadows, asymmetric corners, viewfinder focus brackets, tick-meter loading
  states.
- Six React primitives: `EngineeredButton`, `EngineeredRocker`,
  `EngineeredLed`, `EngineeredStepMeter`, `EngineeredStateCell`,
  `EngineeredToggle`.
- 19-glyph custom SVG icon system replacing 145 emoji characters across
  14 files.
- Animated "Ti" logo and animated "Tempoit" wordmark on the sign-in screen.
- Design token system (CSS custom properties, `--tempo-*` prefix) unified
  across three themes: Midnight Black, Paper Light, Latte.
- Latte theme accent colors named after café menu items: caramel, mocha,
  sage, cinnamon, terracotta, cardamom.

## Phases 11–15 (verified this session)

**Phase 11 — console.log cleanup:** `grep -rn "console.log" src` returns
0 matches. `console.error`/`console.warn` calls (44 total) were
intentionally left in place for production error visibility. Confirmed via
direct diff review of commit `21a7171` — both the log line and its
`if (import.meta.env?.DEV)` wrapper were removed together, no leftover
empty blocks.

**Phase 12 — dependency cleanup:** `@google/genai`, `express`, and `dotenv`
confirmed absent from `package.json`.

**Phase 13 — TypeScript `any` elimination:** `grep -rn ": any\b|<any>|as any\b" src`
returns 0 matches.

**Phase 14 — routing:** `react-router-dom` confirmed in use —
`BrowserRouter` in `src/main.tsx`, `useNavigate`/`useLocation` in
`src/App.tsx`.

**Phase 15 — color tokens:** hardcoded semantic Tailwind color classes
(error/warning/success/neutral) reduced from 46 to 4 matches across
`src/components/*.tsx`. The remaining 4 are confirmed decorative, not
semantic state (confetti particle color, text-selection highlight ×2,
a static theme-preview label) — commit `06c8967`.

## Security — Row-Level Security (RLS)

Verified directly against the live Supabase project via read-only SQL
(not inferred from code):

```sql
select schemaname, tablename, rowsecurity from pg_tables
where schemaname = 'public'
and tablename in ('blocks','habits','habit_logs','daily_intentions');
```

Result: all four tables show `rowsecurity = true`, with per-operation
policies (`select`/`insert`/`update`/`delete`, or a single `all` policy for
`daily_intentions`) whose `qual`/`with_check` clauses are
`(auth.uid() = user_id)` — real per-user isolation, not an empty or
always-true policy.

## Known Documentation Issue

`PROJECT_AUDIT.md` (repo root) incorrectly flags the `sb_publishable_...`
Supabase key as a critical security issue. This is outdated — it is the
current, correct Supabase key format and is safe to ship client-side,
since Row-Level Security (confirmed above), not key format, is what
actually gates data access. That file should be corrected or removed.

## Verification Method

Every ✅ above was confirmed by: a fresh `git clone` of this repository,
running `npx tsc --noEmit` and `npm run build` directly, grepping the
actual source tree, and — for RLS — running read-only SQL directly against
the live Supabase project. No item above was marked done based on an
agent's self-reported summary alone.

To re-verify any of the above at any time:

```bash
git pull
npm install
npx tsc --noEmit
npm run build
```
