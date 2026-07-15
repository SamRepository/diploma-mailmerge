# Diploma Mail-Merge

A protected web app for printing official **bilingual (Arabic + English) PhD diplomas** onto
**pre-printed ministry paper**. Staff manage a database of graduates, position each field
once against a scan of the blank diploma, then print single or bulk diplomas — with the
variable data landing at exact millimetre coordinates, Arabic correctly shaped and RTL.

Because the paper is pre-printed, printed output is **data-only on a transparent
background**; the on-screen preview shows the scan behind the data for verification.

## Features

- 🔐 Login with individual accounts and roles (admin / staff)
- 👥 Student CRUD, search, and status tracking
- 📥 Excel (`.xls`/`.xlsx`) import with auto column-mapping (handles the ministry's Arabic headers)
- 🎯 Visual **calibration editor** — drag each field onto the scanned template (mm coordinates)
- 🖨 Single preview with per-printer **alignment offset**, data-only print + calibration test print
- 📚 Bulk selection → merged PDF export (one A4-landscape page per diploma)
- 🔳 Optional QR field; millimetre calibration grid for alignment

## Tech

Next.js (App Router) · TypeScript · Tailwind · Prisma + SQLite · Auth.js · SheetJS ·
Playwright (headless Chromium for PDF) · pdf-lib · bundled Amiri Arabic font.

## Develop

```bash
cp .env.example .env      # set AUTH_SECRET, ADMIN_* etc.
npm install
npx prisma migrate dev    # create the SQLite schema
npm run seed              # admin user + PhD template + fields
npm run dev               # http://localhost:3000
```

Sign in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env`.

## Deploy

See [docs/deployment.md](docs/deployment.md) — one Docker image, deployed to Coolify from a
GitHub repo, with a persistent volume at `/data`.

## Architecture & method

- [docs/implementation-plan.md](docs/implementation-plan.md) — full design.
- [CLAUDE.md](CLAUDE.md) — architecture rules and conventions.
- The one non-negotiable: **one millimetre coordinate system, one render engine (Chromium)**
  for preview, print, and PDF — so WYSIWYG holds and Arabic shapes natively.
