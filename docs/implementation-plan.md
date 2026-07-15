# Diploma Mail-Merge Web App — Implementation Plan

## Context

The University of Continuing Education prints official bilingual (Arabic + English)
PhD diplomas onto **pre-printed blank paper supplied by the ministry** — each blank
already carries the decorative border, fixed labels, signatures, and a unique serial
`N°`. Staff must feed a blank into the printer and overlay each student's variable
data at **exact (x, y) positions**, then print. Today this is manual and error-prone.

This app turns that into a controlled workflow: a protected database of PhD students,
a per-diploma **preview with fine alignment adjustment**, single + bulk printing, and
PDF export. Because the paper is pre-printed, the printed output must contain **only the
variable data on a transparent background**, precisely aligned — while the on-screen
preview shows the scanned template behind the data so staff can verify placement.

The intended outcome: a staff member selects students, confirms placement, nudges
alignment once for their printer, and prints a stack of correctly-filled diplomas —
with Arabic text correctly shaped and right-to-left.

Decisions locked with the user: **PhD template first** (architected so more types can be
added), **Next.js full-stack**, **SQLite on a persistent volume**, **individual user
accounts with roles**. Deploy target: **Coolify via a GitHub repo (Docker)**.

The `docs/fable_dna/operating-manual.md` reasoning discipline is adopted as the project's
working method (see "Fable DNA" below).

---

## The core design: one coordinate system, one render engine

The make-or-break requirement is **exact placement** + **correct Arabic**. Both are solved
by a single decision: **the browser/Chromium engine is the only thing that ever lays out a
diploma.** One React component, `DiplomaSheet`, renders an A4-landscape page (297×210 mm)
with each field absolutely positioned in **millimetres**. This same component is used for:

- **Screen preview** — with the scanned template image behind the fields.
- **Single print** — `window.print()`, `@page { size: A4 landscape; margin: 0 }`; a print
  stylesheet hides the background so only data prints onto the pre-printed paper.
- **Bulk PDF export** — a server route drives **headless Chromium (Playwright)** over the
  same component to produce one PDF per student (merged with `pdf-lib`).

Because every path uses the same engine and the same mm coordinates, WYSIWYG holds and
Arabic is shaped natively (no fragile Arabic-reshaping libraries).

### Coordinates come from a visual calibration editor, not hardcoding

Rather than computing (x, y) by hand from the scans, staff **drag each field onto the
scanned template** in an in-app editor; positions are saved as mm. This handles the
current rotated/low-res PhD scan, survives a future re-scan, and is the seed of the
"configurable templates" capability without building a full designer now.

### Physical alignment adjustment

Printers and pre-printed stock drift. Each print carries a **global offset (offsetX/offsetY
in mm)** and optional scale, adjustable live in the preview and remembered per
user/printer. A **calibration test-print** (field outlines / a mm grid on plain paper,
optionally *with* the background) lets staff overlay a real diploma and dial in the offset.
Known footgun to document in the UI: the OS print dialog must be set to **"Actual size /
100%", not "Fit to page"**, or every coordinate scales.

---

## Tech stack

- **Next.js (App Router) + React + TypeScript** — single deployable unit.
- **Tailwind CSS** — fast, simple UI.
- **Prisma + SQLite** — DB file on a persistent volume (`file:/data/app.db`).
- **Auth.js (NextAuth) Credentials provider + bcrypt** — email/password, `role` on user.
- **SheetJS (`xlsx`)** — read the legacy `.xls` for bulk import; also CSV/xlsx export.
- **Playwright (Chromium)** — server-side PDF rendering for bulk export.
- **`pdf-lib`** — merge per-student PDFs into one file for bulk print.
- **`qrcode`** — generate the verification QR (as on the Licence sample).
- **Arabic web fonts** bundled locally (OFL-licensed **Amiri** and **Noto Naskh Arabic**),
  served from `/public/fonts` so preview and Chromium PDF match exactly.
- **`zod`** — input validation.

---

## Data model (Prisma / SQLite)

Explicit columns for the known PhD fields (simplest CRUD + validation); the `Template` /
`FieldDefinition` tables keep it extensible to other diploma types.

- **User** — `id, email, name, passwordHash, role (ADMIN | STAFF), createdAt`.
- **Template** — `id, name, degreeType, pageWidthMm, pageHeightMm, backgroundImagePath,
  active`. Has many `FieldDefinition`.
- **FieldDefinition** — `id, templateId, key (e.g. name_latin), label, lang (LATIN | ARABIC),
  xMm, yMm, widthMm, fontSize, fontFamily, align, direction (ltr | rtl), rotationDeg,
  fixedValue (nullable — for constants like "Doctorat")`.
- **Student** — identity + bilingual fields mirrored from the diploma:
  `nameLatin, nameArabic, birthDate, birthPlaceLatin, birthPlaceArabic,
  domainLatin/Arabic, branchLatin/Arabic, specialityLatin/Arabic, grade,
  centerLatin/Arabic, issuePlace, issueDate, serialNumber, registrationCode`,
  plus `templateId, printStatus (PENDING | PRINTED), printedAt`.
- **AuditLog** — `id, userId, studentId, action, offsetX, offsetY, createdAt` — who
  printed/edited what (accountability for protected data).

Seed script creates the first ADMIN and the PhD `Template` + its `FieldDefinition`s.

---

## App structure (routes)

- `/login` — credentials sign-in.
- `/` — dashboard: counts (total / pending / printed), quick actions.
- `/students` — list, search, filter by center/status; row actions.
  `/students/new`, `/students/[id]/edit` — CRUD forms (Latin + Arabic inputs).
- `/students/[id]/diploma` — single preview (template behind data) + offset adjust +
  **Print** (browser) + **Export PDF**.
- `/print/batch` — select many → grid preview → bulk browser print / **export merged PDF**;
  marks `printStatus`.
- `/import` — upload `.xls`/`.xlsx` → column-mapping step → validate → bulk insert.
- `/templates`, `/templates/[id]/calibrate` — **admin**: upload/replace background scan,
  drag fields to set mm coordinates (the visual editor).
- `/admin/users` — **admin**: create/disable staff, set roles.
- API/route handlers for CRUD, PDF export, import.
- `/api/health` — health check for Coolify.

Middleware guards all routes except `/login`; admin routes require `role = ADMIN`.

---

## Where the risk lives (and mitigations)

1. **Arabic shaping / RTL correctness** → single Chromium render engine + bundled Amiri/
   Noto Naskh; verify with real student names (joining forms, mixed digits/dates).
2. **Exact physical alignment on pre-printed stock** → mm coordinate system, per-printer
   offset, plain-paper calibration test-print, and explicit "100% / no fit-to-page" UI
   guidance. Verify by overlaying a test print on a real blank diploma.
3. **Which fields are pre-printed vs. merged** (OPEN) → the ministry serial `N°` is
   pre-printed, so it is *recorded per student but not printed*; whether the registration
   code / "تحت رقم" / issue date are pre-printed or merged must be confirmed against a
   physical PhD blank during calibration. The calibration editor makes each field
   individually toggle-able (print / don't print) so this is adjustable without code.
4. **Data privacy** → auth + roles + audit log; `.xls` and DB never committed; DB on a
   private volume; HTTPS via Coolify.

---

## Deployment (Coolify via GitHub)

- **Dockerfile** based on the official Playwright image (Chromium + system deps
  preinstalled) → `npm ci` → `prisma generate` → `next build` → run `next start`.
- **Persistent volume** mounted at `/data` holding `app.db` and uploaded template images
  (`/data/uploads`). `DATABASE_URL=file:/data/app.db`.
- **Env vars**: `AUTH_SECRET`, `DATABASE_URL`, initial admin credentials for the seed.
- **`.gitignore`**: `node_modules`, `.env*`, `*.db`, and the real `PhD_students_data.xls`
  (student PII must not enter git).
- Coolify builds from the Dockerfile on push; `/api/health` as the health check.
- `prisma migrate deploy` + seed run on container start.

---

## Fable DNA integration

Adopt `operating-manual.md` as the project's working method, recorded in an `AGENTS.md`
at the repo root so it governs future work:

- **State the real task, label assumptions** — the calibration UI explicitly marks each
  field's placement as *verified against a physical print* vs *assumed*; the import
  column-mapping shows *mapped* vs *guessed* columns before committing.
- **Verify by re-deriving** — alignment is confirmed by overlaying a test print on a real
  diploma, not by eyeballing the screen.
- **Attack the conclusion** — the verification checklist (below) includes adversarial
  cases: longest Arabic name, empty optional fields, a re-scanned template.

---

## Project documentation files (created first, on approval)

- **`docs/implementation-plan.md`** — this plan, committed into the repo so it lives with
  the project (the `.claude/plans` copy is session-scoped).
- **`CLAUDE.md`** (repo root) — guidance for Claude Code / contributors, containing:
  - **Project overview** — what the app does (overlay bilingual data onto pre-printed PhD
    diploma blanks) and the locked decisions (Next.js, SQLite-on-volume, Auth.js roles,
    Coolify/Docker deploy).
  - **Architecture rules** — the non-negotiables: one mm coordinate system; the browser/
    Chromium is the only layout engine; data-only print vs. preview-with-background;
    coordinates come from the calibration editor, never hardcoded.
  - **Commands** — dev, build, prisma migrate/seed, PDF export, lint/typecheck.
  - **Conventions** — TypeScript, Tailwind, zod validation, bundled Arabic fonts, Latin +
    Arabic field pairing.
  - **Data privacy rules** — never commit `PhD_students_data.xls`, `.env*`, or `*.db`;
    student PII stays out of git; DB lives on the volume.
  - **Working method** — points to `docs/fable_dna/operating-manual.md` (and mirrors the
    Fable DNA section below) as the reasoning discipline for all changes.

## Build milestones

0. **Docs** — create `docs/implementation-plan.md` and root `CLAUDE.md` (above).
1. **Scaffold + auth** — Next.js + Tailwind + Prisma(SQLite) + Auth.js; login, user CRUD,
   roles, seed admin. Verify: log in, create a staff user.
2. **Students** — CRUD, list/search/filter, and `.xls` import with column mapping.
   Verify: import the sample file, edit a record.
3. **Template + calibration editor** — upload/rotate PhD background, drag fields → mm
   coords, per-field print toggle. Verify: fields sit on the scan in preview.
4. **DiplomaSheet render + single print** — bilingual component, Arabic font, preview with
   background, offset adjust, data-only browser print. Verify: plain-paper test print
   overlays a real diploma.
5. **Bulk + PDF** — multi-select, Playwright PDF per student, merged export, print-status +
   audit log. Verify: export a merged PDF; Arabic shapes correctly.
6. **Deploy** — Dockerfile, volume, env, health check, `.gitignore`; push to GitHub →
   Coolify. Add QR + calibration grid print. Verify: app runs on the Coolify instance.

---

## Verification (end-to-end)

Run `npm run dev`, then exercise the real flow:
1. Log in as admin; create a STAFF user; log in as staff.
2. Import `PhD_students_data.xls`; confirm Latin **and** Arabic values land in the right
   columns; edit one student.
3. Open the PhD template calibrator; drag the ~12 fields onto the scan; save.
4. Preview a student's diploma — data sits correctly over the template, Arabic is RTL and
   shaped.
5. Do a **plain-paper test print** and physically lay it over a real blank PhD diploma;
   adjust offset until aligned; then a data-only print onto an actual (or photocopied)
   blank.
6. Batch-select several students; export a **merged PDF**; open it and check Arabic
   shaping and per-page placement.
7. Adversarial: longest Arabic name, a student missing an optional field, a re-uploaded
   (straightened) template — placement must still hold.

---

## Prerequisites / open items to confirm during build

- **A straightened, high-resolution scan of a *blank* PhD diploma** for accurate
  calibration (the current file is a rotated, medium-res scan). The app will let you
  replace it without code changes.
- **Which fields are pre-printed on the ministry blank vs. merged by us** (serial `N°`,
  registration code, "تحت رقم", issue date/place) — resolved by inspecting a physical blank;
  each field is individually toggle-able in the calibrator.
- **QR code content** — what the QR encodes (verification URL? registration code?).
- Confirm the exact `.xls` column headers/order at import time (mapping step handles
  variation).
