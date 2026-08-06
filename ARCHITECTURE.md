# Architecture

A technical overview for a developer (or buyer's engineering team) picking this codebase up cold. Everything below reflects the actual code as of August 4, 2026 — verified by direct inspection, not inferred from folder/file naming.

## System Shape

Tempo is a **pure client-side single-page application**. There is no custom backend server — Supabase (managed Postgres + Auth + Storage + Edge Functions) is the entire backend. `npm run build` produces static files (`dist/`); there is no SSR, no API routes, no Node server to deploy.

```
┌─────────────────────────────┐
│   Browser (React 19 SPA)    │
│  BrowserRouter + Contexts   │
└──────────────┬───────────────┘
               │ @supabase/supabase-js
               ▼
┌─────────────────────────────┐
│   Supabase Project           │
│  Postgres + RLS + Auth       │
│  + 1 Edge Function            │
└───────────────────────────────┘
```

## State Management

No Redux/Zustand/etc. — state is managed via React Context, split by domain:

- **`TasksContext.tsx`** — the largest and most central piece of state. Owns all tasks/events/timeblocks (the `blocks` table). Implements optimistic local updates, a Supabase Realtime subscription (`channel('blocks-changes')`, filtered by `user_id`, on `postgres_changes`), and a **dual-mode fallback architecture**: if the `blocks` table is unreachable (schema-cache error `PGRST205`, or any query failure), it transparently falls back to `localStorage` (key: `tempo-tasks-v2`) so the app keeps working offline or if Supabase is misconfigured. A `useLocalFallback` boolean flag tracks which mode is active and is set/cleared reactively as calls succeed or fail (there's no separate `navigator.onLine` listener — the fallback is driven by actual request outcomes, not browser network-status events).
- **`contexts/HabitsContext.tsx`** — thin provider (21 lines) wrapping `hooks/useHabitsData.ts`, which owns the `habits` and `habit_logs` tables and computes streaks from real log history (not a stored counter — recalculated from logged dates each time).
- **`hooks/useMorningIntentions.ts`** — owns the `daily_intentions` table (today's top 3 priorities), with its own `localStorage` fallback/cache layer independent of `TasksContext`.
- **`hooks/useVelocityData.ts`** — derives analytics/completion-velocity data. Confirmed via direct inspection: queries the `blocks` table directly (three separate calls) and reuses `mapRowToTask` from `TasksContext.tsx` to normalize rows — same source of truth as everything else, not a separate data path.

Routing is real URL-based routing via `react-router-dom`'s `BrowserRouter` (`src/main.tsx`), with `useNavigate`/`useLocation`/`Navigate` used in `App.tsx` — this replaced an earlier state-based tab system (see `CHANGELOG.md`, July 26).

## Data Model

Four Supabase tables hold all user data. Columns below are reconstructed from the TypeScript interfaces that query them (`DbHabit`, `DbHabitLog`, `DailyIntentionRow` in their respective hook files, and usage in `TasksContext.tsx`) — **not from a direct schema dump**, so treat column lists as "what the frontend code expects," and confirm against Supabase's Table Editor if a column appears to be missing or renamed at the database level.

| Table | Owns | Key columns |
|---|---|---|
| `blocks` | Tasks, scheduled tasks, and calendar events (one unified table, discriminated by a `type` column) | `id`, `user_id`, `title`, `type` ('task'\|'scheduled_task'\|'event'), `category`, `date`, `start_time`, `end_time`, `duration_minutes`, `is_completed`, `completed_at`, `gravity_rank`, `description`, `project_id`, `created_at`, `updated_at` |
| `habits` | Habit definitions | `id`, `user_id`, `name`, `icon`, `color`, `category`, `frequency`, `target_count`, `is_active`, `sort_order`, `created_at` |
| `habit_logs` | Individual habit check-ins, used to compute streaks | `id`, `habit_id`, `user_id`, `logged_date`, `created_at` |
| `daily_intentions` | The 3 morning-priority items per user per day | `id`, `user_id`, `date`, `priority_1`, `priority_2`, `priority_3`, `created_at`, `updated_at` |
| `user_consents` | Which legal-document version each user accepted, and when | `id`, `user_id`, `policy_type`, `policy_version`, `accepted_at`, `user_agent` |

**Security model:** every table above has Row-Level Security enabled with `auth.uid() = user_id` policies — verified directly via `pg_tables`/`pg_policies`, not assumed. See `SECURITY.md`.

**Consolidation note:** `blocks` unifying tasks/scheduled-tasks/events into one table (rather than three) is a deliberate design choice, not an oversight — it lets `TodayView`'s timeline, `WeekView`'s board, and `CalendarView`'s month grid all query the same source of truth with a `type` filter, rather than merging three separate tables' worth of data client-side.

## Design System

CSS custom properties (`--tempo-*` prefix, defined in `src/index.css`) drive a three-theme system: Midnight Black, Paper Light, and Latte (the last using café-menu-item names for its accent colors — caramel, mocha, sage, cinnamon, terracotta, cardamom — a deliberate naming convention, not arbitrary). Six custom "Engineered Control" React components (`EngineeredButton`, `EngineeredRocker`, `EngineeredLed`, `EngineeredStepMeter`, `EngineeredStateCell`, `EngineeredToggle`) each pair a `.tsx` file with a CSS Module (`.module.css`) rather than using Tailwind classes directly, for a distinct hard-edged visual style. A custom 19-glyph SVG icon set (`src/components/icons/`) replaces emoji characters used earlier in the project.

## Backend: Supabase Edge Function

One Edge Function exists: `supabase/functions/delete-account/index.ts` (Deno runtime). It performs account deletion server-side rather than trusting a client-side call, with two independent auth checks (platform JWT verification + an internal `adminClient.auth.getUser()` call) and a CORS origin allowlist. See `SECURITY.md` for the full breakdown.

## External Dependencies Beyond Supabase

Only one: **Google Fonts**, loaded via `@import url(...)` inside four components' inline `<style>` blocks (`WeekView.tsx`, `VelocityDashboard.tsx`, `CommandPalette.tsx`, `SettingsView.tsx`) — DM Sans, DM Serif Display, and JetBrains Mono. No other third-party APIs, analytics, or tracking scripts were found anywhere in `src/`.

## Known Architectural Notes (Not Necessarily Bugs)

- **Theme initialization is split** across `main.tsx` (applied on load, before React mounts) and `SettingsView.tsx` (applied on change) — both independently read/write the same `localStorage` key (`tempo-theme`). Functionally consistent today, but a single `ThemeContext` would be cleaner if this file is touched again.
