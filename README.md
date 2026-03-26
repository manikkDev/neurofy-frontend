# Neurofy Frontend

React + Vite + TypeScript frontend for the Neurofy tremor monitoring platform.

## Setup

```bash
cd Frontend
npm install
cp .env.example .env    # edit if backend runs on a different port
npm run dev
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |

## Routes

| Path | Description |
|------|-------------|
| `/` | Home / landing page |
| `/login` | Login page |
| `/signup` | Signup page |
| `/patient/dashboard` | Patient dashboard |
| `/doctor/dashboard` | Doctor dashboard |
| `*` | 404 Not Found |

## Environment Variables

See `.env.example` for all required variables.

## Structure

```
src/
  app/           — App root, router, query provider
  components/    — Reusable UI and navigation components
  features/      — Domain feature modules (Phase 1+)
  hooks/         — Custom React hooks
  layouts/       — Page layouts (AppShell, AuthLayout)
  lib/           — Utility libraries
  pages/         — Route page components
  services/      — API client, socket client
  styles/        — Global CSS / Tailwind
  types/         — Shared TypeScript types
```
