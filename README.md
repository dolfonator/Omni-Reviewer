# Omni-Reviewer

Personal study packs: organize topics, attach sources, and generate four persistent study modes from what you upload.

## What it is

Omni-Reviewer is a signed-in, single-user study app.

- **Topics** are the top-level tabs.
- Each topic holds many **reviewers** (study packs).
- Each reviewer owns its own uploaded **sources** and an independent set of four **study modes**.

### Four study modes (per reviewer)

1. **Locked In**. Comprehensive, cohesive, chronological long-form study document.
2. **Summary**. Detailed summary of Locked In for last-minute review.
3. **Test Me**. Questionnaire / quiz of the material.
4. **Carded**. Flashcards derived from Summary.

Study modes are persisted. Generate or regenerate only on an explicit action.

### v1 ingest rules

| Upload kind | Behavior |
| --- | --- |
| PDF, image, text | Fully ingested and used as generation input |
| Video, audio | Stored (blob reference only); **not** transcribed or parsed in v1 |

## Local setup

```bash
npm install
cp .env.example .env.local
# fill in values in .env.local
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Required environment variables

Names only — set values in `.env.local` (local) or your host (production):

| Name | Purpose |
| --- | --- |
| `APP_PASSWORD` | Shared gate password for the single user |
| `AUTH_SECRET` | Session signing secret |
| `AUTH_TRUST_HOST` | Set to `true` so the first production host is accepted |
| `AUTH_URL` | Canonical app URL (set after first production deploy) |
| `DATABASE_URL` | Neon Postgres connection string |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob read/write token |
| `GEMINI_API_KEY` | Gemini API key for generation |
| `AI_MODEL` | Model id (default `gemini-3.7-flash`) |

See `.env.example` for the full list.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push Drizzle schema to the database |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm test` | Run Vitest |

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, Auth.js, Drizzle ORM, Neon Postgres, Vercel Blob.
