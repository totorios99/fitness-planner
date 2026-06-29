# Forma — Training Tracker

**v0.5** — Home greeting polish, mobile heatmap calendar layout, planner responsive heading, flame icon.

## Purpose

Import Strong `.txt` exports, track workout history, manage exercise library with muscle targeting, plan weekly routines, chart progress. Companion app to Mise (meal planner) on same machine.

## Dev server

```bash
npm run dev        # http://localhost:3002 (dev)
npm run db:push    # apply schema changes
npm run db:seed    # seed 46 exercises + 3 predefined routines
npm run db:studio  # Prisma Studio UI
```

> Dev runs on **3002**; the Docker container publishes on **3001** (see Docker below).

## Stack

- **Next.js 16** (App Router, `force-dynamic` on all DB pages)
- **Prisma 7 + libSQL** — SQLite at `/DATA/AppData/forma/forma.db` (Docker) or project root (dev)
- **TypeScript strict**
- **CSS custom properties** — no Tailwind, no component library
- **@dnd-kit/core** — drag-and-drop in weekly planner
- **sharp** — server-side image resize on exercise photo upload

## Routes

| Route | File | Purpose |
|-------|------|---------|
| `/` | `app/page.tsx` | Home dashboard: greeting, consistency heatmap (hero), recent sessions, this-week rail, quick actions |
| `/log` | `app/log/page.tsx` | Import Strong .txt + session history list |
| `/log/[id]` | `app/log/[id]/page.tsx` | Session detail: sets table, muscle breakdown |
| `/exercises` | `app/exercises/page.tsx` | Exercise library with search/filter |
| `/exercises/[slug]` | `app/exercises/[slug]/page.tsx` | Exercise detail: image upload, muscle tags, recent sessions |
| `/routines` | `app/routines/page.tsx` | List predefined routines |
| `/routines/[id]` | `app/routines/[id]/page.tsx` | Routine editor (add/remove exercises per day) |
| `/progress` | `app/progress/page.tsx` | SVG line charts per exercise (max weight or total volume) |
| `/planner` | `app/planner/page.tsx` | Weekly planner: drag routine days onto calendar slots |

## API routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/import` | POST | Parse Strong .txt, exact-match exercises, save session (stubs on miss) |
| `/api/sessions` | GET | All sessions (paginated) |
| `/api/sessions/[id]` | GET/DELETE | Single session |
| `/api/exercises` | GET | All exercises |
| `/api/exercises/[slug]/image` | POST | Upload + sharp-resize exercise photo to 480×360 WebP |
| `/api/routines` | GET/POST | List/create routines |
| `/api/routines/[id]` | GET/PUT/DELETE | Routine CRUD |
| `/api/routine-days` | POST | Add day to routine |
| `/api/routine-days/[dayId]/exercises` | GET | Exercises for a routine day |
| `/api/routine-exercises/[id]` | DELETE | Remove exercise from routine day |
| `/api/planner` | GET/POST | Weekly planner slots |
| `/api/planner/[slotId]` | DELETE | Remove planner slot |
| `/api/template` | GET/POST | Default week template slots |
| `/api/progress/[slug]` | GET | Per-exercise progress points for chart |

## Schema (8 models)

```
Exercise          — library (46 seeded), primaryMuscles/secondaryMuscles as JSON arrays, type (lifting|mobility), unilateral bool
WorkoutSession    — date, label, source ('strong_import'|'manual'), type (lifting|mobility)
SessionExercise   — links session ↔ exercise, stores rawName for unmatched
SetLog            — weightLb, reps, setNumber
Routine           — name, daysPerWeek, description, type (lifting|mobility)
RoutineDay        — dayIndex, label, belongs to Routine, type
RoutineExercise   — exercise + targetSets/targetReps, belongs to RoutineDay
PlannerSlot       — (weekStart, dayOfWeek) unique; nullable routineDayId
TemplateSlot      — (dayOfWeek, slotIndex) default week template; nullable routineDayId
```

## Key files

- `lib/strongParser.ts` — parses Strong .txt format (date, exercises, sets)
- `lib/muscles.ts` — muscle enum + label map; `parseMuscles(json)`, `muscleVar`, `muscleGroup` helpers
- `lib/home.ts` — `getHomeData()` server data-access: thisWeek / recent / consistency (heatmap weeks + streaks computed in TS)
- `lib/cal.ts` — `calLevel()` util (maps 0–3 heat level to CSS color); shared by server page + client heatmap
- `lib/prisma.ts` — Prisma client singleton
- `components/AppShell.tsx` — layout wrapper: TopNav + shell-main + TabBar
- `components/TopNav.tsx` — sticky pill topbar (`.topbar` / `.topbar-inner`), theme toggle cycling light→dark→auto
- `components/TabBar.tsx` — fixed bottom 4-tab nav (mobile)
- `components/ThemeProvider.tsx` — 3-state theme (light/dark/auto) with live OS tracking
- `components/home/Greeting.tsx` — client component; 4-bucket time greeting, date eyebrow (no year), subtitle; uses `.home-eyebrow` / `.home-title` / `.home-sub`
- `components/home/ConsistencyHeatmap.tsx` — client component; desktop = 24-week scrollable column grid; mobile (≤560px) = 7-col × 5-row calendar layout with week-date labels and tap-to-reveal session info
- `components/home/QuickActions.tsx` — quick action buttons on home
- `components/LineChart.tsx` — custom SVG chart (no recharts)
- `components/MuscleSummary.tsx` — bar list of sets per muscle group
- `prisma/seed.ts` — 46 exercises + Upper/Lower, PPL, Full Body 3× routines

## Muscle volume formula

- Primary muscle = sets × 1.0
- Secondary muscle = sets × 0.5 (rounded up)
- Unilateral exercises: volume counted per side (×2 effective sets)

## Image strategy

Exercise photos live at `public/exercises/{slug}.webp`. Upload via exercise detail page → `POST /api/exercises/[slug]/image` → sharp resizes to 480×360. Falls back to emoji placeholder.

## Design system — Mise glass

Ported from Mise (github.com/totorios99/meal-planner) to match its glass aesthetic.

- **Dark-primary** (`color-scheme: dark`), light theme auto-follows OS
- **Wallpaper**: fixed full-bleed `.wallpaper` div (rendered in `AppShell`) — radial gradients + dark overlay + animated drift. Palette set on `<html data-wallpaper>` (default `mist`; variants `sand`/`plum`/graphite)
- **Glass material tokens**: `--panel` (translucent gradient fill), `--glass-blur: 28px`, `--stroke` / `--stroke-hi` (translucent borders), `--inset-hi` (top highlight), `--shadow-glass`, `--well` (recessed input bg)
- **Surfaces**: cards/nav/tabbar = `var(--panel)` + `backdrop-filter: blur()` + `--inset-hi` + `--shadow-glass`. Nav and tabbar are floating pills (`--r-pill: 999px`)
- **Accent — clay**: `--accent: #c98a63`, `--accent-grad` for primary buttons. `--energy` aliased to clay
- **Theme toggle**: light → dark → auto; stored in `localStorage('forma-theme')`, applied via `[data-theme]` on `<html>`
- **Type**: `--display` (Geist sans, bold) for titles with gradient `em`. `--serif` (Newsreader) retained but unused on titles now. Geist is a variable font — non-standard weights (450, 650) render correctly without snapping.
- **Home masthead**: `.home-eyebrow` (12px/650/0.14em/uppercase) → `.home-title` (46px → 32px ≤640px → 28px ≤400px) → `.home-sub` (15px/450). Eyebrow class is separate from `.board-eyebrow` used in Planner.
- **Planner heading**: `.board-head` uses CSS grid at ≥561px — eyebrow spans top row, title left + week-nav/Clear flush right on same row.
- **Muscle colors**: kept (functional), oklch with brighter values for dark glass
- Port: 3001 (Mise uses 3000)

## CSS class conventions

Shell: `.app` (root, transparent) + `.wallpaper` (fixed bg) + `.topbar`/`.topbar-inner` (glass pill nav) + `.tabbar`/`.tabbar-item`/`.tabbar-dot` (floating mobile pill). Old `.app-shell`, `.top-nav`, `.tab-bar`, `.tab-item`, `.tab-dot` kept as aliases in globals.css.

## Docker / CasaOS

`docker-compose.yml` builds the standalone Next image, publishes **3001:3000**, mounts
`/DATA/AppData/forma` for the SQLite DB (`DATABASE_URL=file:/data/forma.db`). The container
runs `scripts/migrate.js` (`prisma db push`) on boot, then `server.js`. No AI/API-key env.

The compose carries an `x-casaos:` metadata block (title, icon, port_map) so CasaOS shows
Forma as a **native app**, not a legacy imported container. Swap the `icon:` URL for your own.

`deploy.sh` at project root handles build + restart (`docker compose build && up -d`).

## Dev workflow (solo)

- `main` is always deployable — what CasaOS builds. Work on short-lived `feat/*` / `fix/*` /
  `chore/*` branches, self-review the diff (`/code-review`) before merging, tag deploys
  (`v0.4`…) for rollback.
- Loop: branch → build → `npm run build` + local click-test → merge `main` → tag → run
  `deploy.sh` on the CasaOS box. Schema changes: `npm run db:push` locally; the container
  auto-pushes on boot.

## What NOT to add

- No AI integration
- No nutrition tracking (that's Mise)
- No macro/calorie counting
