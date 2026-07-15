# CLAUDE.md

Guidance for Claude Code (and human contributors) working in this repository.

## Project overview

A protected web app that prints official **bilingual (Arabic + English) PhD diplomas** by
overlaying each student's variable data at exact positions onto **pre-printed blank paper
supplied by the ministry**. The blank already carries the border, fixed labels, signatures,
and a unique pre-printed serial `N°`. The app's job: keep a database of PhD students, let
staff preview placement, nudge alignment for their printer, and print single or bulk
diplomas — plus export PDFs.

Because the paper is pre-printed, **printed output is data-only on a transparent
background**; the on-screen preview shows the scanned template behind the data for
verification.

Locked decisions:
- **Next.js (App Router) + React + TypeScript**, single deployable unit.
- **SQLite via Prisma**, DB file on a persistent volume (`file:/data/app.db`).
- **Auth.js (NextAuth) Credentials** with individual accounts and roles (`ADMIN` | `STAFF`).
- Deploy to **Coolify from a GitHub repo via Docker**.

The full design lives in [`docs/implementation-plan.md`](docs/implementation-plan.md).

## Architecture rules (non-negotiable)

1. **One coordinate system.** Every field position is stored and reasoned about in
   **millimetres** on an A4-landscape page (297×210 mm). No pixel coordinates in the data
   model.
2. **One layout engine.** The browser / headless **Chromium** is the *only* thing that lays
   out a diploma — for screen preview, `window.print()`, and Playwright PDF export. This
   guarantees WYSIWYG and correct native Arabic shaping. Do **not** introduce a second
   rendering path (e.g. drawing text directly with pdf-lib/pdfkit) or Arabic-reshaping libs.
3. **Data-only print vs. preview-with-background.** The shared `DiplomaSheet` component
   shows the template image on screen but hides it under `@media print` so only data lands
   on the pre-printed paper. `@page { size: A4 landscape; margin: 0 }`.
4. **Coordinates come from the calibration editor, never hardcoded.** Field positions are
   set by dragging fields onto the scanned template and saved as mm in the DB. A re-scanned
   template must not require code changes.
5. **Per-print alignment offset.** All print/export paths accept a global `offsetX`/
   `offsetY` (mm) to correct printer/stock drift.

## Commands

```bash
npm run dev            # local dev server
npm run build          # production build
npm start              # run production build
npm run lint           # eslint
npm run typecheck      # tsc --noEmit
npx prisma migrate dev # create/apply migrations (dev)
npx prisma migrate deploy  # apply migrations (prod/container start)
npm run seed           # seed initial ADMIN user + PhD template + field definitions
```

(Scripts are added as milestones land; keep this list in sync.)

## Conventions

- **TypeScript** everywhere; validate all external input (forms, imports, API) with **zod**.
- **Tailwind CSS** for styling; keep UI simple and functional.
- **Bilingual field pairing.** Student text fields come in Latin + Arabic pairs
  (`nameLatin`/`nameArabic`, …). Arabic fields render `dir="rtl"` with a bundled Arabic font.
- **Fonts are bundled locally** (OFL Amiri / Noto Naskh Arabic in `public/fonts`) so preview
  and Chromium PDF match exactly — never rely on a remote font.
- Server-side data access through a single Prisma client; guard routes via middleware
  (`ADMIN`-only routes check role).

## Data privacy rules

- **Never commit student PII or secrets.** `PhD_students_data.xls`, `.env*`, and `*.db` are
  gitignored and must stay that way. Do not add real student data to fixtures, tests, or
  commit messages.
- Student data is protected behind auth + roles; edits/prints are recorded in an audit log.
- The production DB lives on the Coolify volume, not in the repo.

## Working method (Fable DNA)

This project adopts the reasoning discipline in
[`docs/fable_dna/operating-manual.md`](docs/fable_dna/operating-manual.md). Apply it to the
code, not just prose:

- **State the real task; label assumptions.** In the calibration UI, mark each field's
  placement as *verified against a physical print* vs *assumed*. In `.xls` import, show
  *mapped* vs *guessed* columns before committing.
- **Verify by re-deriving.** Confirm alignment by physically overlaying a test print on a
  real diploma — not by eyeballing the screen.
- **Attack the conclusion.** Test adversarial cases: the longest Arabic name, empty optional
  fields, a re-scanned template. Placement must still hold.
