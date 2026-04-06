# CivicPulse+

CivicPulse+ is a mobile-first Progressive Web App that combines habit-forming sustainability missions with real civic engagement flows: issue reporting, local drives, ward-level community feed, and social progress tracking.

Core loop:

Trigger -> Action -> Reward -> Progress -> Social Reinforcement

Every core action updates XP/streak/impact and can generate a community feed event.

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- PostgreSQL + Prisma
- JWT auth
- Gemini API integration (with heuristic fallback)
- PWA manifest + service worker

## Product Scope

- Designed for small-scale deployment (up to 50 users max)
- 5-tab mobile navigation: Home, Missions, Report, Community, Profile
- Gamification: XP, streak, levels, badges (Seed -> Sapling -> Guardian -> Champion)
- Impact engine: CO2 + civic points

## Quick Start

1. Install dependencies

```bash
npm install
```

2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

- `DATABASE_URL` for PostgreSQL
- `JWT_SECRET` long random secret
- `GEMINI_API_KEY` optional (AI falls back to heuristic if missing)

3. Generate Prisma client and push schema

```bash
npm run db:push
```

4. Seed sample data

```bash
npm run db:seed
```

5. Start development server

```bash
npm run dev
```

Open http://localhost:3000

## Demo Account

- Email: `demo@civicpulse.app`
- Password: `Demo@123`

## Key Scripts

- `npm run dev` - run development app
- `npm run lint` - lint codebase
- `npm run build` - production build
- `npm run db:push` - apply Prisma schema to database
- `npm run db:migrate` - run Prisma migration workflow
- `npm run db:seed` - seed baseline data

## Folder Structure

```text
web/
	prisma/
		schema.prisma
		seed.ts
	public/
		sw.js
		icons/
	src/
		app/
			(main)/
				page.tsx
				missions/page.tsx
				report/page.tsx
				community/page.tsx
				profile/page.tsx
			auth/page.tsx
			api/
				auth/
				dashboard/
				missions/
				reports/
				drives/
				feed/
				leaderboard/
				profile/
				learning/
		components/
		hooks/
		lib/
		types/
```

## API Surface

- Auth: `/api/auth/register`, `/api/auth/login`, `/api/me`
- Dashboard: `/api/dashboard`
- Missions: `/api/missions`, `/api/missions/complete`
- Reporting: `/api/reports`, `/api/reports/[id]/status`
- Drives: `/api/drives`, `/api/drives/[id]/join`, `/api/drives/[id]/checkin`
- Community: `/api/feed`, `/api/feed/[id]/like`, `/api/feed/[id]/comment`
- Leaderboard: `/api/leaderboard?scope=ward|friends`
- Profile: `/api/profile`
- Learning: `/api/learning`, `/api/learning/complete`

## PWA Notes

- Installable from mobile browser
- Offline-ready caching for core routes
- App-like standalone mode

## Operational Notes

- User registration is capped at 50 users.
- Gemini API is optional; issue tagging gracefully falls back to keyword heuristics.
- Service worker file is located at `public/sw.js`.

