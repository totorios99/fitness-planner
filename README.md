# Forma

Personal training tracker. Import Strong `.txt` exports, browse workout history, manage an exercise library with muscle targeting, plan weekly routines, and chart progress over time.

Companion app to [Mise](https://github.com/totorios99/meal-planner) — both run on the same CasaOS box and share the same glass design system.

## Features

- **Import** Strong app `.txt` exports → exact-match exercises, auto-stub unknowns
- **Log** — session history, per-session sets table + muscle breakdown
- **Exercise library** — 46 seeded exercises, muscle tags, photo upload, progress charts
- **Routines** — create lifting or mobility routines with per-day exercise lists
- **Planner** — drag routine days onto a weekly calendar; default template week
- **Progress** — SVG line charts per exercise (max weight or total volume)
- **Home dashboard** — consistency heatmap, streak stats, this-week rail, quick actions

## Stack

- **Next.js 16** — App Router, all DB pages `force-dynamic`
- **Prisma 7 + libSQL** — SQLite
- **TypeScript strict**
- **CSS custom properties** — no Tailwind, no component library
- **@dnd-kit/core** — planner drag-and-drop
- **sharp** — server-side exercise photo resize (480×360 WebP)

## Dev

```bash
npm install
npm run dev          # http://localhost:3002
npm run db:push      # apply schema
npm run db:seed      # seed 46 exercises + 3 routines
npm run db:studio    # Prisma Studio
```

## Deploy (CasaOS / Docker)

```bash
./deploy.sh          # docker compose build && up -d
```

Publishes on **port 3001**. SQLite lives at `/DATA/AppData/forma/forma.db` on the host. Schema migrations run automatically on container boot (`prisma db push`).

The `docker-compose.yml` includes `x-casaos:` metadata so Forma appears as a native app in CasaOS.

## Design

Mise glass system — dark-primary with animated wallpaper, translucent glass surfaces, clay accent (`#c98a63`), floating pill nav. Theme toggle: light → dark → auto (follows OS).
