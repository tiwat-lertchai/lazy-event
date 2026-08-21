# lazy-event-api

Backend API for **lazy-event** — a LINE LIFF app for the CSAI64 + CSAI65 send-off event at CRU (Chandrakasem Rajabhat University). Handles LIFF-based photo upload for printing, a print queue with admin management, and a congrats/send-off message board, all tied together with LINE Messaging API push notifications.

## Tech stack

- **Runtime**: [Bun](https://bun.sh)
- **Framework**: [Hono](https://hono.dev)
- **Database**: [Neon](https://neon.tech) (serverless PostgreSQL) via [Drizzle ORM](https://orm.drizzle.team)
- **Auth**: LINE LIFF access token (per-request user identity) + admin allowlist table
- **Notifications**: LINE Messaging API (push messages)
- **Storage**: Local disk (photos saved on server, served as static files)

## Features

- **Photo upload for print** — accepts an image via `multipart/form-data`, stores the original on disk, and creates one print job per selected paper size (`4x6`, `polaroid_3x3`)
- **Print queue** — each print job moves through `pending → printing → done` (or `failed`, with retry back to `pending`); users can see only their own jobs, admins can see and update all of them
- **Print-done notifications** — pushes a LINE message to the photo owner once their print job is marked `done`
- **Advice / message board** — congrats messages displayed on screen at the event; anyone can post and read, only admins can delete

## Getting started

### Install dependencies

```sh
bun install
```

### Environment setup

Copy `.env.example` to `.env` (or create `.env` directly) and fill in the values:

```env
# LINE Messaging API
LINE_CHANNEL_ID=checkout-at-line-developer-console
LINE_CHANNEL_SECRET=checkout-at-line-developer-console
LINE_ACCESS_TOKEN=checkout-at-line-developer-console
LINE_WEBHOOK_URL=https://localhost:3000/webhook

# Database 
DATABASE_URL=postgresql://neondb_owner:p4ssW0rD@your.db.neon.tech/neondb?sslmode=require

# Upload Directory
UPLOAD_DIR=./uploads/photos
UPLOAD_PUBLIC_URL=https://localhost:3000/uploads

# CORs
CORS_ORIGIN=http://localhost:5173,https://your.domain.name,https://liff.line.me/liff-url-please
```

| Variable | Description |
|---|---|
| `LINE_CHANNEL_ID` | LIFF channel ID from the LINE Developers Console |
| `LINE_CHANNEL_SECRET` | Used to verify incoming webhook signatures |
| `LINE_ACCESS_TOKEN` | Channel access token for the Messaging API (push/reply messages) |
| `LINE_WEBHOOK_URL` | Public URL LINE sends webhook events to |
| `DATABASE_URL` | Neon Postgres connection string |
| `UPLOAD_DIR` | Local folder where uploaded photos are saved |
| `UPLOAD_PUBLIC_URL` | Public base URL the `/uploads/*` route is served from |
| `CORS_ORIGIN` | Comma-separated list of allowed frontend origins |

### Database migrations

```sh
bunx drizzle-kit generate   # generate SQL migrations from schema.ts
bunx drizzle-kit migrate    # apply migrations to Neon
```

For quick local iteration without generating migration files:

```sh
bunx drizzle-kit push
```

### Run

```sh
bun run dev
```

Server runs at `http://localhost:3000`.

## API overview

### Photos / print queue

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/photos` | User | Upload a photo, creates a print job per selected paper size |
| `GET` | `/photos/queues` | User | List the requesting user's own print jobs |
| `GET` | `/photos/queues/:id` | User | Get a single print job (must be the owner) |
| `GET` | `/photos/admin/queues` | Admin | List all print jobs, optional `?status=` filter |
| `PATCH` | `/photos/admin/queues/:id` | Admin | Update a print job's status; pushes a LINE message when set to `done` |

### Advices (message board)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/advices` | — | List all messages |
| `GET` | `/advices/:id` | — | Get a single message |
| `DELETE` | `/advices/:id` | Admin | Delete a message |

## Project structure

```
src/
├── index.ts                     # App entry point, middleware, route mounting
├── db/
│   ├── schema.ts                 # Drizzle schema (photos, print_jobs, advices, admins)
│   └── client.ts                 # Neon connection + Drizzle instance
├── domain/
│   └── photoQueue/
│       └── stateMachine.ts       # Print job status transition rules
├── middleware/
│   ├── requireUser.ts            # Verifies LIFF access token, attaches lineUserId
│   └── requireAdmin.ts           # Checks lineUserId against the admins table
├── routes/
│   ├── photos.ts                 # Upload + print queue routes
│   └── advices.ts                # Message board routes
└── shared/
    ├── providers/line/messaging/
    │   └── client.ts              # LINE Messaging API push/reply + signature verification
    └── storage/
        └── local.ts               # Local disk photo storage
```

## License

GPL-3.0