# Forma

Mobile-first gym training tracker. Import workouts from Strong, track session history, manage exercises with muscle targeting, build routines, plan your week, and chart progress per exercise.

Companion app to [Mise](../Mise) (meal planner) — same machine, same Docker/CasaOS stack, different port.

---

## Features

- **Strong import** — paste or share a `.txt` export from the Strong app; exercises are fuzzy-matched to the library automatically
- **Exercise library** — 46 exercises seeded across push/pull/legs/core with primary and secondary muscle tracking; upload photos per exercise
- **Session history** — per-session breakdown: sets table, muscle volume heatmap, total volume
- **Routine builder** — create routines with named days; drag to reorder exercises, set targets (sets × reps), collapse/expand days
- **Weekly planner** — drag routine days onto a Mon–Sun calendar; navigate weeks
- **Progress charts** — inline on each exercise page: max weight and total volume over time, best set, volume % change

---

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| Database | SQLite via Prisma 7 + libSQL adapter |
| Language | TypeScript (strict) |
| Styling | CSS custom properties — no Tailwind |
| Drag & drop | @dnd-kit/core |
| Image processing | sharp (server-side, resizes to 480×360 WebP) |
| Charts | Custom SVG `LineChart` component |

---

## Getting started

```bash
# Install
npm install

# Create database and apply schema
npm run db:push

# Seed 46 exercises + 3 predefined routines
npm run db:seed

# Dev server at http://localhost:3001
npm run dev
```

### Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Default dev config points the database to `prisma/forma.db` in the project root.

---

## Database

```bash
npm run db:push      # apply schema changes (dev)
npm run db:seed      # seed exercises and routines
npm run db:studio    # open Prisma Studio at http://localhost:5555
```

Schema has 7 models: `Exercise`, `WorkoutSession`, `SessionExercise`, `SetLog`, `Routine`, `RoutineDay`, `RoutineExercise`, `PlannerSlot`.

---

## Project structure

```
app/
  page.tsx                     # Home — week stats, muscle volume, recent sessions
  log/                         # Import Strong .txt + session history
  exercises/                   # Exercise library with search/filter
  exercises/[slug]/            # Exercise detail — info, image, progress charts
  routines/                    # Routine list + create
  routines/[id]/               # Routine editor — days, exercises, DnD reorder
  planner/                     # Weekly calendar — assign routine days to days
  api/                         # All API routes (no client-side DB access)

components/
  TabBar.tsx                   # Bottom nav (mobile) / sidebar (desktop ≥768px)
  LineChart.tsx                # Custom SVG chart
  MuscleSummary.tsx            # Bar list of sets per muscle group

lib/
  strongParser.ts              # Parses Strong .txt export format
  muscles.ts                   # Muscle enum + label map
  prisma.ts                    # Prisma client singleton

prisma/
  schema.prisma
  seed.ts                      # 46 exercises, Upper/Lower + PPL + Full Body 3× routines
```

---

## Muscle volume formula

- Primary muscle contribution: `sets × 1.0`
- Secondary muscle contribution: `sets × 0.5` (ceiling)

Used in weekly volume summaries on the home page and session detail pages.

---

## Importing workouts from Strong

1. In the Strong app: open any workout → Share → Export as text
2. In Forma: go to **Log** → tap the import zone or drag the `.txt` file onto it
3. Exercises are fuzzy-matched to the library; unmatched ones appear flagged in the session detail

---

## Docker / CasaOS

```bash
# Build and run
docker compose up -d

# Rebuild after code changes
docker compose up -d --build
```

`docker-compose.yml` maps port `3001:3000` and mounts `/DATA/AppData/forma` for the database.

```yaml
environment:
  - DATABASE_URL=file:/data/forma.db
```

For a fresh container, `scripts/migrate.js` runs `db push` + `db seed` on first start.

---

## Predefined routines (seeded)

| Routine | Days | Split |
|---------|------|-------|
| Upper / Lower | 4 | Upper A/B, Lower A/B |
| Push / Pull / Legs | 6 | Push A/B, Pull A/B, Legs A/B |
| Full Body 3× | 3 | Full Body A/B/C |

Additional routines can be created in-app via the **+ New** button on the Routines page.
