# Tempo App — Project Audit Report
**Generated:** June 14, 2026
**Audited by:** Static code analysis (read-only)

---

## 1. Tech Stack & Architecture

### 1.1 Core Frontend
*   **Framework & Version:** React 19.1.0 with Vite 6.2.3 (Fast, high-performance module bundler).
*   **Language:** TypeScript (Strict, type-safe development).
*   **Styling Solution:** Tailwind CSS v4.1.14 using the official high-performance `@tailwindcss/vite` compiler plugin. Global styles are defined cleanly inside `src/index.css`.
*   **Animations:** `motion` (formerly framer-motion) v12.23.24, utilizing physics-based interactive layout elements and keybind fade-ins.
*   **Icons:** `lucide-react` v0.546.0 as the unified vector SVG icon library.

### 1.2 State Management & Routing
*   **State Model:** Centralized context engine (`src/TasksContext.tsx`) exposing `useTasksData` hook to provide unified, reactive CRUD methods, fallback local state, and sync indicators throughout the app.
*   **Routing System:** Elegant, client-side React tab router managed via the `activeSidebarTab` string state in `src/App.tsx`. Supports direct hotkey switching, sidebar button bindings, and transition animations.

### 1.3 Backend & Synchronization
*   **Database Integration:** Supabase (`@supabase/supabase-js` v2.107.0).
*   **Connection URL:** `https://vrqdyyonogcuffxyhprg.supabase.co` (configured in `/src/supabaseClient.js`).
*   **Authentication & Metadata:** Standard user logins and profile states are synced with the Supabase Auth database, with user metadata (bio, display names, avatar URLs) updated in real-time.

---

## 2. Folder Structure

The project follows a modular, clean, and highly structured directory representation:

```
src/
  components/
    AuthScreen.tsx            # Login, signup, and credentials verification
    CalendarView.tsx          # Full grid monthly calendar visualizer
    CommandPalette.tsx        # System-wide keyboard shortcuts / launcher dialog
    EnergyPlannerView.tsx     # High-cognitive load segment allocation planner
    EveningReview.tsx         # Staged day-end summary and wrap-up flow
    FocusMode.tsx             # Immersive Pomodoro focus dashboard with ambient sound
    HabitsView.tsx            # Daily streaks and percentage completion counters
    Logo.tsx                  # Standardized vector branding components
    SettingsView.tsx          # Appearance, customized colors, and account panels
    TodayView.tsx             # Primary daily planner, checkbox checkins, timeblockers
    VelocityDashboard.tsx     # Analytics, logs, and completion velocities
    WeekView.tsx              # Staggered 7-day board columns layout
  App.tsx                     # Frame parent, sidebar, toast notices, tab routers
  index.css                   # Global Tailwind imports and theme variable overrides
  main.tsx                    # Main entry, loads theme states, mounts React tree
  supabaseClient.js           # Supabase connection client setup
  types.ts                    # Global TypeScript interfaces and type declarations
  useNow.ts                   # Core timing utilities hook
```

---

## 3. Feature Status

| Page / Route | Component | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Today View** | `TodayView` | ✅ Working | Unified local/Supabase query, drag-to-rank, checkbox completions, dynamic timeline matching. |
| **Week View** | `WeekView` | ✅ Working | Multi-column 7-day calendar layout. Populated with card items synced in real-time. |
| **Month View** | `CalendarView` | ✅ Working | Grid calendar mapping months by numbers, interactive date cell selection. |
| **Habits Tracker** | `HabitsView` | ✅ Working | Weekly gauges, completion milestones, morning and evening checklist reviews. |
| **Energy Planner**| `EnergyPlannerView` | ✅ Working | Intuitive category segments planning by daily mental bandwidth (Deep, Social, Admin, etc). |
| **Velocity Stats**| `VelocityDashboard`| ✅ Working | Focus graphs and category chart distributions. |
| **App Settings**  | `SettingsView` | ✅ Working | Configures colors, font scale selectors, durations, and profiles. |
| **Evening Review**| `EveningReview` | ✅ Working | Staged day wrap-up checklist, reflection, and prep for tomorrow. |
| **Command Palette**| `CommandPalette`| ✅ Working | Global accessibility launcher with hotkey trigger 'K' / Cmd+K. |
| **Inbox Space**   | `InboxView` | ❌ Deleted | Audited and successfully deleted entirely from layout routing, shortcuts, context collections, and files to respect product updates. |

---

## 4. Data Layer

### 4.1 Supabase Connection Properties
*   **Database URL:** `https://vrqdyyonogcuffxyhprg.supabase.co` is set correctly.
*   **Credential Check:** The public anon key is defined as `"sb_publishable_f9cF17MjiEdNWA_bgB-oow_qNy76yv0"`. It does **not** begin with the standard JSON Web Token (JWT) prefix `"eyJ..."`. While this may signify an custom configuration setup for the development container, it is a noteworthy configuration point for live standard production environments.

### 4.2 Database Table & RLS Schema
The database client queries the `blocks` table to read/write all timeblocks, tasks, and calendar events:
*   **`blocks` Table (Expected Columns):** `id`, `user_id`, `title`, `type` ('task','scheduled_task','event'), `category`, `date`, `start_time`, `end_time`, `duration_minutes`, `is_completed`, `completed_at`, `gravity_rank`, `description`, `project_id`, `created_at`, `updated_at`.
*   **Table-Missing Resiliency:** If the `blocks` table does not exist or gets a query error (code `PGRST205` / schema cache error), `TasksContext.tsx` catches this gracefully, prints a quiet warning, and falls back to full-featured client-side `localStorage` sync.
*   **Realtime Subscriptions:** Subscriptions to `postgres_changes` are established under channel `'blocks-changes'` filtered by `user_id`, updating the view automatically on remote changes.

### 4.3 Data Flow & Fallback Architecture
*   If connected to Supabase: writes and updates are sent incrementally to cloud and optimistic local updates occur instantly.
*   If offline or unauthenticated: writes are saved under the `localStorage` key `"tempo-tasks-v2"` using initialized fallback seeds generated dynamically with date calculations relative to the current week.

---

## 5. Known Bugs & Issues

### 🔴 Critical (Connection / Data Loss Risk)
1.  **Issue:** Non-JWT Format for Supabase Key
    *   **Location:** `/src/supabaseClient.js:11`
    *   **Impact:** Normal Supabase setups will fail to authenticate client actions (giving authorization errors) due to the key not being a standard JWT.
    *   **Suggested Fix:** Replace the key string with a valid JWT anon key starting with signed token parameters `"eyJ..."`.

### 🟡 Moderate (Functional but Polish Required)
1.  **Issue:** Manual Offline Toggle Missing
    *   **Location:** `/src/TasksContext.tsx`
    *   **Impact:** If the user drops connection during a live cloud session, requests will timeout or fail before falling back.
    *   **Suggested Fix:** Monitor network connectivity using standard window listeners (`navigator.onLine`) and switch the local toggle `setUseLocalFallback(true)` dynamically.

### 🟢 Minor (Polish / UX)
1.  **Issue:** Split Theme Initialization
    *   **Location:** `src/main.tsx` vs `src/components/SettingsView.tsx`
    *   **Impact:** CSS root overrides and local storage reads are split across file nodes instead of being managed by a clean React theme provider.
    *   **Suggested Fix:** Consolidate themes into a dedicated `ThemeContext.tsx` using simple custom hook calls.

---

## 6. Settings Wiring Status

| Setting Section | Reads From | Writes To | Persisted? | Applied to UI? |
| :--- | :--- | :--- | :--- | :--- |
| **Theme (Dark/Light/Forest)** | `tempo-theme` | LocalStorage | Yes | **Full.** Root Element `document.documentElement` receives active class. |
| **Accent Color** | `tempo-accent-color`| LocalStorage | Yes | **Full.** Overrides CSS variable `--color-accent` variables. |
| **Font Scale** | `tempo-font-scale` | LocalStorage | Yes | **Full.** Adjusts the root pixel scaling (`fontSize`). |
| **Focus Work minutes** | `tempo-pomo-work-time` | LocalStorage | Yes | **Full.** Evaluated dynamically by reducer in `FocusMode.tsx`. |
| **Short Break duration** | `tempo-pomo-short-break`| LocalStorage | Yes | **Full.** Synced to focus break intervals. |
| **Long Break duration** | `tempo-pomo-long-break` | LocalStorage | Yes | **Full.** Loaded during session sets of 4 cycles. |
| **Daily Focus Goal** | `tempo-pomo-target-daily`| LocalStorage | Yes | **Full.** Compares target total in completion charts. |
| **Shortcuts Sidebar** | `tempo-show-shortcuts`| LocalStorage | Yes | **Full.** Toggles keyboard cheat list. |
| **User Profile Metadata** | Auth Service | Supabase Auth| Yes | **Full.** Displayed inside account headers and settings. |
| **Profile Avatar Upload** | Avatars Storage bucket| Supabase Auth| Yes | **Yes.** Fallback to standard base64 if storage is restricted. |

---

## 7. Component Quality

*   **Prop Drilling:** Kept to an absolute minimum. Sub-components retrieve the required tasks lists and database mutation helper handles directly from `useTasksData()`.
*   **Loading States:** High quality. Primary views check `isLoading` state from central providers to display beautiful pulsing skeletal screens rather than blank content.
*   **Error Boundaries:** Graceful and robust. Schema misses, server issues, and table errors are captured to guarantee fallbacks with uninterrupted local state.
*   **Empty States:** Exceptionally clean. Views design custom slate backgrounds with graphic elements and call-to-action tips when task lists are empty.
*   **Memory Cleanups:** Event listeners (like window keydowns) and Supabase channels/subscriptions return reliable cleanup methods inside `useEffect` hook returns to avoid leaks.

---

## 8. Priority Fix Roadmap

1.  **Supabase Auth Public Key Alignment:** Standardize the anon key parameters inside `/src/supabaseClient.js` to ensure production authorization queries pass verification.
2.  **Network State Subscription:** Implement dynamic network monitor state toggles in the data context to cleanly transition in/out of cloud sync without requiring browser refreshes.
3.  **Unified Theme Context Provider:** Refactor global Tailwind customized stylesheets, key colors, and scale states into a clean, unified settings provider context.

---

## 9. What's Working Well ✅

*   **Pristine Visual Interface:** Splendid layout architectures with modern cosmic midnight-black themes, elegant typography configurations, custom-spaced cards, and exquisite dark negative spaces.
*   **Dynamic Calendar and Timeline Mappings:** Calendar grid generators and Day progress sliders dynamically map dates relative to current times flawlessly.
*   **Frictionless Keyboard Accelerators:** Global launcher trigger options, accessibility cheat sheets, Escape handlers, and Space focus timer triggers are highly interactive and fully documented.
*   **Excellent Database Resiliency:** High-quality Postgres-missing queries exception handlings which automatically fall back to local storage models seamlessly.
