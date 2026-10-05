# BCU Computing Society

**Birmingham City University · Computing Society**

From your first lecture to your first offer.

The society's website, live at **[bcucompsoc.com](https://bcucompsoc.com)**. It brings together everything a BCU computing student needs in one place:

- **Opportunities**: spring weeks, summer internships, placements and graduate roles, refreshed twice a day ([/opportunities](https://bcucompsoc.com/opportunities))
- **Internal roles**: positions within the society itself ([/sca-opportunities](https://bcucompsoc.com/sca-opportunities))
- **Events**: upcoming and past events, in a calendar or list ([/events](https://bcucompsoc.com/events))
- **Committee**: who runs the society, and how to join it ([/committee](https://bcucompsoc.com/committee))
- **Research**: papers written by society members ([/research](https://bcucompsoc.com/research))
- **CV builder**: fill in your education, experience, skills and interests, then download a clean, ATS-friendly CV in one click ([/cv-builder](https://bcucompsoc.com/cv-builder))
- **Resources**: CV and cover letter templates and programming cheat sheets, downloadable as PDF or Word ([/resources](https://bcucompsoc.com/resources))
- **Project marketplace**: students list a project with its scope, tech stack, roadmap and the team it needs; others filter by their skills and apply. Project owners accept applicants, assign roles and coordinate over real-time project chat ([sca-project-finder.vercel.app](https://sca-project-finder.vercel.app/))

Follow us on [LinkedIn](https://uk.linkedin.com/company/bcu-computing-society) and [Instagram](https://www.instagram.com/bcucompsoc).

---

## Tech stack

- **Framework**: Next.js 14 (App Router), TypeScript
- **Styling**: Tailwind CSS with design tokens in `src/app/globals.css` (light and dark themes)
- **Database**: PostgreSQL via Prisma
- **Animation**: Framer Motion
- **Deployment**: Vercel

## Running it locally

You need Node 20 and a PostgreSQL database.

```bash
npm install
cp .env.example .env      # then fill in DATABASE_URL at minimum
npm run db:push           # create the tables
npm run db:seed           # optional: sample data
npm run dev               # http://localhost:3000
```

Everything else in `.env.example` is optional. The site runs without it:

| Variable | Used for |
|---|---|
| `DATABASE_URL` | **Required.** Opportunities, comments, admin |
| `GOOGLE_CALENDAR_ID`, `GOOGLE_CALENDAR_API_KEY` | Live events from the society's Google Calendar. Without them the events page uses `src/app/events/fallbackEvents.ts` |
| `GEMINI_API_KEY`, `RESEND_API_KEY`, `NOTIFY_EMAIL`, `NOTIFY_FROM_EMAIL` | The opportunity scraper only (see below). Set these as GitHub Actions secrets |

## How opportunities are kept up to date

A GitHub Actions workflow (`.github/workflows/scrape-opportunities.yml`) runs `npm run scrape` every 12 hours. It:

1. Collects listings from **Gradcracker**, **HigherIn**, **TargetJobs**, **Trackr** and **LinkedIn**. Trackr and LinkedIn mostly re-find the same roles, so their listings are dropped when the role is already on the site or came from an earlier source
2. Uses Gemini to tidy each listing into a consistent format and filter out roles that aren't relevant to computing students
3. Imports the results, closes listings that have disappeared or passed their deadline, and checks that application links still work
4. Emails a summary of the run

The code lives in `scripts/pipeline/`. Run it by hand with `npm run scrape` (needs the scraper variables above).

## Project structure

```
src/app/            pages (one folder per route) and API routes
src/components/     shared UI, grouped by area (layout, home, opportunities, events, cv…)
src/lib/            database client, helpers, date and calendar utilities
prisma/             database schema and seed scripts
scripts/pipeline/   the opportunity scraper
```
