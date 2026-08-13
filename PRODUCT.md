# Omni-Reviewer

## What this is

Omni-Reviewer is a signed-in, single-user personal study tool. One person uploads course material, then studies it through four generated views that stay on the pack until they choose to regenerate.

It is not multi-tenant, not a marketing site, and not a shared classroom product. Auth is a single shared password so a public deploy cannot spend generation credits without the gate.

## Who it is for

Tristan (or one operator) studying late at night from notes, PDFs, slides, and lecture media. Primary jobs:

1. Group study packs under topics.
2. Attach sources to a pack.
3. Generate a durable study set once.
4. Read, quiz, and drill cards without regenerating on every open.

## Core objects

| Object | Role |
| --- | --- |
| **Topic** | Top-level wayfinding tab. Holds many reviewers. |
| **Reviewer** | A study pack: sources + four independent views. |
| **Source** | An uploaded file (PDF, image, text, video, audio) with an ingest status. |
| **View** | One of four persisted study surfaces for a reviewer. |

## Information architecture

- `/login` - password only. No signup, no roles.
- `/` - topic tabs, create/rename/delete topic, list of reviewers in the selected topic, create/rename/delete reviewer.
- `/topics/[topicId]/reviewers/[reviewerId]` - pack workspace: source list and upload, generate/regenerate, four view tabs.

Topic tabs are primary navigation. A reviewer is a workspace, not a metrics dashboard.

## Ingest rules (v1)

| Kind | Behavior | UI badge |
| --- | --- | --- |
| PDF, image, text | Fully ingested; used for generation | **Ready** (or **Failed** with message) |
| Video, audio | Stored as blob only; not transcribed | **Not yet processed** |

Failed sources keep an error message. Video/audio-only packs cannot generate in v1.

## Four views

Generated only on explicit Generate / Regenerate. Tab changes never call the model. Views reload from persistence.

1. **Locked In** - comprehensive, cohesive, chronological long-form study document (markdown). Source of truth.
2. **Summary** - detailed summary of Locked In for last-minute review (markdown).
3. **Test Me** - questionnaire: optional reveal of answers, optional local score (not persisted).
4. **Carded** - flashcards from Summary: flip, previous / next.

## Generation

- Explicit button only. Confirm before regenerating when views already exist.
- Disabled when no source is `ready`.
- Clear error when the pack is video/audio only or has no ingested text.
- Pipeline (server): ready sources → Locked In → Summary → Test Me → Carded; all four upserted together.

## Auth and security facts

- Auth.js Credentials, shared `APP_PASSWORD`, session via `AUTH_SECRET`.
- Middleware/proxy protects pages and APIs; unauthenticated pages go to `/login`, APIs return 401.
- `XAI_API_KEY` is server-only. Client never reads it.
- Client uploads go direct to Vercel Blob, then `POST` metadata to `/api/reviewers/[id]/sources`. Do not wait on Blob `onUploadCompleted` for source rows.

## Configuration (names only)

| Variable | Role |
| --- | --- |
| `APP_PASSWORD` | Shared gate password |
| `AUTH_SECRET` | Session signing |
| `AUTH_TRUST_HOST` | Accept host before `AUTH_URL` is set |
| `AUTH_URL` | Canonical production URL |
| `DATABASE_URL` | Neon Postgres |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob |
| `XAI_API_KEY` | Generation (server only) |
| `AI_MODEL` | Model id; default `grok-4.6` |

## Product principles

- Operate UI: task first, chrome quiet, reading surface warm.
- Empty states teach the model (topic → reviewer → sources → generate).
- Full control states: empty, loading, error, disabled, hover, focus.
- Copy never uses an em dash.
- Icons: Phosphor only.
- Mobile: single column below 768px; no horizontal overflow at 390px.
