# Developer Guide

**A note on this file's framing:** this is not a public open-source contribution guide, because Tempo isn't an open-source project accepting outside pull requests (see `LICENSE-recommendation.md` — this is being kept as a proprietary asset). This file exists instead as an onboarding reference for whoever works on this codebase next, whether that's you, a hired developer, or a buyer's engineering team.

## Getting Started

```bash
git clone https://github.com/MIBKIRA/Tempo.git
cd Tempo
npm install
npm run dev
```

Full details in `README.md` → Local Development.

**Use `npm`, not `bun`,** even though `bun.lock` exists in the repo alongside `package-lock.json`. Every verification of this project (`tsc --noEmit`, `npm run build`) was done with npm; the two lockfiles can resolve slightly different dependency versions, and only the npm path has been confirmed working. Delete `bun.lock` unless there's a specific reason to keep it.

## Before Committing Any Change

This project has an established, non-negotiable verification habit — carried through its entire recent history — worth continuing:

```bash
npx tsc --noEmit   # must exit 0, zero errors
npm run build      # must succeed
```

Do not consider a change "done" based on a coding agent's own summary of what it did. This project has twice caught an AI coding agent reporting false success (claiming a fix was applied and verified when `git pull` showed no new commit at all). The working pattern: re-clone or re-pull, then independently re-run the checks above and grep for whatever the change claimed to do, before trusting it.

## Code Conventions (Observed, Not Prescribed)

These aren't rules written in advance — they're patterns already consistently followed in the existing code, worth matching:

- **Styling:** use the `--tempo-*` CSS custom-property tokens defined in `src/index.css`, not raw Tailwind color utilities, for anything representing state (error/warning/success/neutral) or theme-sensitive color. Raw Tailwind color classes are fine for genuinely decorative, non-semantic uses (see the small documented exception list in `TCS-02-fix-plan.md`).
- **Dev-only logging:** if you need a `console.log` during development, wrap it in `if (import.meta.env?.DEV) { ... }` so it's stripped from production builds — don't leave bare `console.log` calls. `console.error`/`console.warn` are fine unguarded (kept for production error visibility).
- **TypeScript:** no `any` — the codebase currently has zero instances; keep it that way.
- **Supabase writes:** every new table should get RLS enabled and `auth.uid() = user_id`-scoped policies from the start, following the existing pattern in `supabase/migrations/`, not added later as an afterthought.

## Where Things Live

See `ARCHITECTURE.md` for the full breakdown. Quick map: view components in `src/components/`, shared state in `src/TasksContext.tsx` and `src/contexts/`, Supabase queries in `src/hooks/`, design tokens in `src/index.css`, database migrations in `supabase/migrations/`.

## Project History & Status

`TCS-01-design-manifesto.md` and `TCS-02-fix-plan.md` in the repo root are living, independently-verified status documents from this project's recent audit-and-fix cycle — read those before assuming something is or isn't done.
