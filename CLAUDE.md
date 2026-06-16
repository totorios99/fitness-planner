# Forma — Training Tracker

**v0.2** — Rebuilt from AI nutrition app → pure gym training tracker. No AI, no nutrition anywhere.

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
| `/api/import` | POST | Parse Strong .txt, fuzzy-match exercises, save session |
| `/api/sessions` | GET | All sessions (paginated) |
| `/api/sessions/[id]` | GET/DELETE | Single session |
| `/api/exercises` | GET | All exercises |
| `/api/exercises/[slug]/image` | POST | Upload + sharp-resize exercise photo to 480×360 WebP |
| `/api/routines` | GET/POST | List/create routines |
| `/api/routines/[id]` | GET/PUT/DELETE | Routine CRUD |
| `/api/routine-days` | POST | Add day to routine |
| `/api/routine-exercises` | POST/DELETE | Add/remove exercise from routine day |
| `/api/planner` | GET/POST | Weekly planner slots |
| `/api/progress/[slug]` | GET | Per-exercise progress points for chart |

## Schema (7 models)

```
Exercise          — library (46 seeded), primaryMuscles/secondaryMuscles as JSON arrays
WorkoutSession    — date, label, source ('strong_import'|'manual')
SessionExercise   — links session ↔ exercise, stores rawName for unmatched
SetLog            — weightLb, reps, setNumber
Routine           — name, daysPerWeek, description
RoutineDay        — dayIndex, label, belongs to Routine
RoutineExercise   — exercise + targetSets/targetReps, belongs to RoutineDay
PlannerSlot       — (weekStart, dayOfWeek) unique; nullable routineDayId
```

## Key files

- `lib/strongParser.ts` — parses Strong .txt format (date, exercises, sets)
- `lib/muscles.ts` — muscle enum + label map; `parseMuscles(json)`, `muscleVar`, `muscleGroup` helpers
- `lib/home.ts` — `getHomeData()` server data-access: thisWeek / recent / consistency (heatmap weeks + streaks computed in TS)
- `lib/prisma.ts` — Prisma client singleton
- `components/home/*` — Home screen islands: `Greeting` (client, local-time greeting), `ConsistencyHeatmap`, `QuickActions`
- `components/LineChart.tsx` — custom SVG chart (no recharts)
- `components/MuscleSummary.tsx` — bar list of sets per muscle group
- `prisma/seed.ts` — 46 exercises + Upper/Lower, PPL, Full Body 3× routines

## Muscle volume formula

- Primary muscle = sets × 1.0
- Secondary muscle = sets × 0.5 (rounded up)

## Image strategy

Exercise photos live at `public/exercises/{slug}.webp`. Upload via exercise detail page → `POST /api/exercises/[slug]/image` → sharp resizes to 480×360. Falls back to emoji placeholder.

## Branding

- `--accent`: `#1E3A5F` (navy)
- `--energy`: `#D4520C` (orange)
- Fonts: Geist + Newsreader (same as Mise)
- Port: 3001 (Mise uses 3000)

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
  (`v0.3`…) for rollback.
- Loop: branch → build → `npm run build` + local click-test → merge `main` → tag → run
  `deploy.sh` on the CasaOS box. Schema changes: `npm run db:push` locally; the container
  auto-pushes on boot.

## What NOT to add

- No AI integration
- No nutrition tracking (that's Mise)
- No macro/calorie counting
