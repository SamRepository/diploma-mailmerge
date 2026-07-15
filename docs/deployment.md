# Deployment (Coolify via GitHub / Docker)

The app is a single Docker image built from the repo's [`Dockerfile`](../Dockerfile). It runs
migrations and an idempotent seed on start, then serves on port `3000`. SQLite data and
uploaded template scans live on a **persistent volume** mounted at `/data`.

## 1. Push to GitHub

```bash
git init
git add .
git commit -m "Diploma mail-merge app"
git branch -M main
git remote add origin git@github.com:<you>/diploma-mailmerge.git
git push -u origin main
```

Student PII and secrets are gitignored (`.env*`, `*.db`, `PhD_students_data.xls`, `/uploads`).

## 2. Create the resource in Coolify

- **New Resource → Application → your GitHub repo.**
- **Build Pack: Dockerfile** (Coolify auto-detects the `Dockerfile`).
- **Port:** `3000`.
- **Health check path:** `/api/health`.

## 3. Persistent storage

Add a **Persistent Volume**:

| Setting | Value |
| --- | --- |
| Mount path | `/data` |

This holds `app.db` and uploaded template scans (`/data/uploads`). Without it, data is lost on redeploy.

## 4. Environment variables

| Variable | Value | Notes |
| --- | --- | --- |
| `DATABASE_URL` | `file:/data/app.db` | SQLite on the volume |
| `AUTH_SECRET` | *(random 32+ chars)* | `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | `true` | behind Coolify's proxy |
| `AUTH_URL` | *(the app's public URL, with port)* | e.g. `https://diploma.panel.enset-skikda.dz:8000` — see below |
| `UPLOADS_DIR` | `/data/uploads` | uploaded scans on the volume |
| `PDF_RENDER_BASE_URL` | `http://127.0.0.1:3000` | in-container PDF rendering |
| `ADMIN_EMAIL` | *(your email)* | first admin, created by seed |
| `ADMIN_PASSWORD` | *(strong password)* | change after first login |
| `ADMIN_NAME` | `Administrator` | |
| `NODE_ENV` | `production` | (already set in the image) |

`PORT`, `HOSTNAME`, and `PDF_RENDER_BASE_URL` are baked into the image but can be overridden.

### `AUTH_URL` and the sign-out redirect

Auth.js derives its sign-in/callback/sign-out URLs from the app's origin. Set `AUTH_URL` to
the full public URL **including the port** and with **no trailing slash**. If it is wrong,
users are bounced to that wrong origin on sign-out — a stray `AUTH_URL=https://localhost:3000`
sends them to `https://localhost:3000/login`.

Verify the deployed origin at any time — this endpoint is public and must echo the real host:

```bash
curl -s https://<your-app-url>/api/auth/providers
# "callbackUrl": "https://<your-app-url>/api/auth/callback/credentials"
```

Auto-detection via `AUTH_TRUST_HOST` alone is not sufficient here: the proxy's forwarded-host
header drops the non-standard `:8000`, so the origin resolves without the port.

## 5. Deploy

Coolify builds the image and starts the container. On boot the entrypoint:

1. creates `/data` + `/data/uploads`,
2. runs `prisma migrate deploy`,
3. runs the idempotent seed (admin user + PhD template + field definitions),
4. starts the server.

Then open the app URL, sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`, and **change the password**.

## 6. First-run checklist

1. **Templates → Calibrate:** upload a straight, high-res scan of a *blank* PhD diploma and
   drag each field onto its line. Mark pre-printed fields (e.g. the serial `N°`) as
   non-printable. Save.
2. **Templates → Calibration grid:** print at 100% on plain paper, confirm a major square is
   exactly 50 mm, overlay a real diploma, and set the X/Y offset on the diploma screen.
3. **Import:** upload the ministry Excel, confirm the auto-mapping, import.
4. Print a data-only test onto an actual blank and fine-tune the offset.

## Local Docker test

```bash
docker build -t diploma-mailmerge .
docker run --rm -p 3000:3000 \
  -e AUTH_SECRET=dev-secret-please-change-0123456789 \
  -e DATABASE_URL=file:/data/app.db \
  -e ADMIN_EMAIL=admin@example.com -e ADMIN_PASSWORD=admin1234 \
  -v diploma_data:/data \
  diploma-mailmerge
# → http://localhost:3000
```

## Notes & follow-ups

- **Blank PhD scan:** the calibration is only as accurate as the uploaded scan. Prefer a
  straightened, high-resolution scan of an unfilled diploma.
- **QR content:** the QR field encodes the registration number by default. Change its source
  or fixed value once the ministry's verification format is confirmed.
- **Backups:** copy `/data/app.db` from the volume periodically.
