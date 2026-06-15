<div align="center">
  <img width="80" height="80" alt="Tempo Logo" src="public/logo.png" />
  <h1>Tempo</h1>
  <p><strong>Every hour. Intentional.</strong></p>

  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
  ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
  ![TailwindCSS](https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
</div>

---

## What is Tempo?

Tempo is a personal productivity OS built for knowledge workers who want to plan their time with intention. It combines task management, energy-aware scheduling, habit tracking, and weekly analytics into one focused workspace.

---

## Features

**Today View**
Plan your day around your energy. See your Morning Intentions, scheduled time blocks, and daily habits — all in one place.

**Week View**
A full weekly calendar with time block visualization across all 7 days.

**Habits Tracker**
Track daily habits with streaks, completion history, a 90-day contribution graph, and intelligent insights — all synced to Supabase in real time.

**Energy Planner**
Allocate your cognitive energy across Deep, Light, Admin, Creative, and Social work categories.

**Velocity Dashboard**
A weekly analytics screen showing planned vs completed tasks, focus hours, time debt, productive hour heatmaps, and postpone analysis.

**Evening Review**
A guided end-of-day reflection to close out your day intentionally.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Backend & Auth | Supabase (PostgreSQL + RLS + Realtime) |
| Auth Providers | Email/Password + Google OAuth |

---

## Database Schema

The app uses three main tables in Supabase:

- **`blocks`** — tasks, scheduled tasks, and events with energy categories
- **`habits`** — user-defined daily habits with icons, colors, and categories
- **`habit_logs`** — daily check-in records per habit
- **`profiles`** — user profile data including username and date of birth

All tables have Row Level Security (RLS) enabled — users can only access their own data.

---

## Run Locally

**Prerequisites:** Node.js 18+

1. Clone the repo:
   ```bash
   git clone https://github.com/YOUR_USERNAME/tempo.git
   cd tempo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the app:
   ```bash
   npm run dev
   ```

---

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase public anon key |

---

<div align="center">
  <p>Built with focus. Designed for flow.</p>
</div>
