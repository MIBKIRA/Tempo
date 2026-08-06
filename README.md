# Tempo

A keyboard-first productivity and calendar web app that unifies tasks, time-blocking, habits, and daily reflection into a single planning surface.

> **Note on this README:** every claim below was verified directly against the source in this repository (not inferred from naming or assumed). Where something could not be verified, it's marked explicitly rather than guessed.

---

## What Tempo Does

Tempo is a single-page web app for daily and weekly planning, built around the idea that tasks have different *energy costs* (Deep, Light, Admin, Creative, Social) and should be planned accordingly rather than just listed.

### Core Views
| View | Component | What it does |
|---|---|---|
| Today | `TodayView.tsx` | Daily task list + timeline, time-blocking, morning intentions modal |
| Week | `WeekView.tsx` | 7-day column board |
| Month | `CalendarView.tsx` | Grid calendar with energy-category color coding |
| Habits | `HabitsView.tsx` | Habit tracking with streak calculation from real log history |
| Energy Planner | `EnergyPlannerView.tsx` | Plans the day by cognitive-load category rather than just time |
| Focus Mode | `FocusMode.tsx` | Pomodoro-style focus sessions with ambient sound |
| Evening Review | `EveningReview.tsx` | End-of-day reflection and next-day prep |
| Velocity | `VelocityDashboard.tsx` | Completion analytics over time |
| Settings | `SettingsView.tsx` | Theme (3 themes), accent color, font scale, Pomodoro durations, profile |
| Command Palette | `CommandPalette.tsx` | Global keyboard launcher (Cmd/Ctrl+K) |

### Account & Legal
Full auth flow (sign up, sign in, email confirmation, profile completion), account deletion (client UI + a Supabase Edge Function that performs the actual deletion), and a complete legal document set (Terms of Service, Privacy Policy, Cookie Policy, Acceptable Use Policy, Account Deletion Policy, EULA) live under `legal/`. See [`legal/README.md`](../legal/README.md) for what still needs a named legal entity filled in before publishing those documents.

---

## Tech Stack

Versions below are copied directly from `package.json` — not paraphrased.

| Layer | Technology | Version |
|---|---|---|
| Framework | React | ^19.0.1 |
| Build tool | Vite | ^6.2.3 |
| Language | TypeScript | ~5.8.2 |
| Styling | Tailwind CSS | ^4.1.14 (via `@tailwindcss/vite`) |
| Animation | `motion` (Framer Motion) | ^12.23.24 |
| Icons | `lucide-react` (+ a 19-glyph custom SVG set) | ^0.546.0 |
| Routing | `react-router-dom` | ^7.18.1 |
| Backend | Supabase (Postgres + Auth + Storage + Edge Functions) | `@supabase/supabase-js` ^2.107.0 |

**Note:** `package.json`'s `name` field is still `"react-example"` and `version` is `"0.0.0"` — leftover from the original scaffold, never renamed. See the action plan below.

---

## Local Development

```bash
git clone https://github.com/MIBKIRA/Tempo.git
cd Tempo
npm install
npm run dev
```

The dev server runs on **port 3000** (set explicitly in `package.json`'s `dev` script), not Vite's default 5173.

**Package manager note:** this repo currently contains *both* `package-lock.json` (npm) and `bun.lock` (Bun). All verification in this project's history was done with `npm install` / `npm run build`. Pick one and remove the other's lockfile before handoff — having both invites a new developer to use the wrong one and get different resolved versions.

### Available Scripts
```bash
npm run dev      # start dev server (port 3000)
npm run build    # production build → dist/
npm run preview  # preview the production build locally
npm run clean    # remove dist/
npm run lint     # runs `tsc --noEmit` (there is no separate ESLint config in this repo)
```

---

## Environment Variables

**Current reality, verified directly in `src/supabaseClient.js`:** the app does **not** currently read Supabase configuration from environment variables. The Supabase project URL and public key are hardcoded directly in that file. `.env.example` in the repo root currently describes `GEMINI_API_KEY` and `APP_URL` — these are unused leftovers from the project's original Google AI Studio scaffold (the `@google/genai` package that would have used them was already removed from `package.json`). Nothing in the current codebase reads either variable.

This means: **there is nothing to configure via `.env` for the app to run today** — it will connect to the Supabase project hardcoded in `supabaseClient.js` out of the box.

This is safe from a data-exposure standpoint only because Row-Level Security is correctly enabled and verified on every table that holds user data (see **Security** below) — the key format itself doesn't gate access, RLS does. It is still not ideal practice for a project changing owners, since a new owner can't point the app at their own Supabase project without editing source code directly. See the action plan for the recommended fix.

---

## Build & Deployment

`npm run build` produces a static `dist/` bundle (confirmed: this repo's most recent verified build succeeded with `dist/index.html`, one CSS bundle, and one JS bundle — no server-side rendering, no API routes).

The repo ships pre-configured SPA rewrite rules for **both**:
- **Vercel** — `vercel.json` rewrites all paths to `/index.html`
- **Netlify** — `public/_redirects` does the same

Either platform works with zero additional config, since this is a pure client-side SPA using `react-router-dom`'s `BrowserRouter`. No CI/CD pipeline (GitHub Actions or similar) currently exists in the repo — builds and deploys are manual.

---

## Project Structure

```
src/
  components/         # 27 components — views, auth screens, Engineered* design-system primitives
    Engineered*.tsx    # Custom button/toggle/gauge/LED design-system primitives (+ .module.css each)
    icons/              # Custom 19-glyph SVG icon set
  contexts/
    HabitsContext.tsx   # Thin provider wrapping useHabitsData
  hooks/
    useHabitsData.ts     # Habits + habit_logs Supabase queries, streak calculation
    useMorningIntentions.ts
    useVelocityData.ts
  config/
    legalVersions.ts     # Tracks which legal-doc version each user has consented to
  data/
    legalDocuments.ts
  TasksContext.tsx      # Central task/block state: Supabase sync + localStorage fallback
  supabaseClient.js     # Supabase client init (see Environment Variables above)
  types.ts               # Shared TypeScript types
  App.tsx / main.tsx
supabase/
  functions/delete-account/  # Edge Function: verifies JWT, deletes user + data
  migrations/                 # 3 SQL migrations (legal consent table + server-side age check)
legal/                  # Terms, Privacy Policy, EULA, etc. — see legal/README.md
```

---

## Security

Verified directly against the live database (read-only SQL, not inferred from code) as of August 4, 2026:

- **Row-Level Security is enabled and correctly scoped** on all four core data tables — `blocks`, `habits`, `habit_logs`, `daily_intentions`. Every policy's condition is `auth.uid() = user_id`; confirmed to be a real filter, not an always-true or empty policy.
- **Server-side age enforcement exists** — a database trigger/function enforces a minimum age of 13 on the `profiles` table (see `supabase/migrations/20260801_legal_consents_and_age_check.sql`), not just the client-side check.
- **Account deletion is implemented** via a Supabase Edge Function (`supabase/functions/delete-account`) with two layers of JWT verification (platform-level + an internal `adminClient.auth.getUser()` check) and an origin allowlist for CORS.
- **No auth token or session logging** exists anywhere in the source.
- **The Supabase key in `supabaseClient.js` is `sb_publishable_...` format**, which is the current, correct public key format — not a legacy JWT `anon` key, and not a mistake. It's safe to expose client-side because RLS (above), not key secrecy, is what gates data access.
- **Credentials are hardcoded in source rather than environment-configured** — functionally safe today given RLS, but see the action plan for the recommended fix before a new owner needs to point this at their own Supabase project.

For how to report a security issue, see [`SECURITY.md`](./SECURITY.md).

---

## Roadmap

*This section is intentionally left as a placeholder.* No product roadmap, planned-features list, or version-2 scope exists anywhere in this repository's code, commits, or documentation — writing one here would mean inventing it rather than reporting it. If you want a roadmap in this README, the accurate source is your own intentions, not this audit.

---

## License

See [`LICENSE-recommendation.md`](./LICENSE-recommendation.md) — a formal `LICENSE` file has not been added yet pending that decision.
