# Seeding a fresh production database from your local one

Use this **once**, when production has no data you need to keep, to carry your local
calibration **and** students to Coolify in a single step. It replaces the container's
`/data/app.db` with your local `prisma/dev.db`.

> Run every command yourself. Your local database holds real student PII — it must never be
> committed, and should only ever travel over your own authenticated Coolify session, never a
> public URL or a chat window.

## Why a file copy, and not git

Git carries only code. Three things live in the database, not git:

- **Calibration** — field positions, sizes, fixed values, removed fields (`FieldDefinition`).
- **Students** (`Student`).
- **Your admin login** (`User`).

The start-up seed creates fields at *default* positions on a fresh DB — it does **not**
reproduce the positions you dragged or the fields you removed. Copying the DB file is what
carries your actual calibration across.

This is safe because your `dev.db` already has every migration in the repo applied, so the
container's `prisma migrate deploy` is a no-op, and the idempotent seed's upserts leave your
existing rows (and your removed-field flags) untouched.

## 1. Deploy the code first

Make sure Coolify has built the current `main`. The database you upload must match the code:
both have the same six migrations. If deploys aren't firing, fix that before touching data.

## 2. Get `dev.db` onto the server

Pick the method that matches your access.

### A. You have SSH to the Coolify host (simplest, most reliable)

```bash
# on your machine
scp prisma/dev.db  user@your-coolify-host:/tmp/app.db
# then, on the host — find the app container id in Coolify, or `docker ps`
docker cp /tmp/app.db  <container-id>:/data/app.db.incoming
rm /tmp/app.db
```

### B. Only the Coolify container terminal (no host SSH)

Encode locally, paste into the container. Run this in **PowerShell** from the repo root:

```powershell
$in  = [IO.File]::ReadAllBytes("prisma\dev.db")
$ms  = New-Object System.IO.MemoryStream
$gz  = New-Object System.IO.Compression.GZipStream($ms,[System.IO.Compression.CompressionMode]::Compress)
$gz.Write($in,0,$in.Length); $gz.Dispose()
[Convert]::ToBase64String($ms.ToArray()) | Set-Content -NoNewline -Encoding ascii dev.db.gz.b64
```

Open `dev.db.gz.b64`, copy all of it, then in the **Coolify container terminal**:

```bash
cat > /tmp/db.gz.b64 <<'EOF'
<paste the base64 here>
EOF
base64 -d /tmp/db.gz.b64 | gunzip > /data/app.db.incoming
rm /tmp/db.gz.b64
```

Delete `dev.db.gz.b64` from your machine afterwards — it is your student data.

## 3. Swap the file and restart

In the container terminal:

```bash
cd /data
[ -f app.db ] && cp app.db "app.db.replaced-$(date +%Y%m%d-%H%M%S)"   # keep the old one
mv app.db.incoming app.db
```

Then **restart the application in Coolify** — the running Node process holds the old database
file open, so the new file only takes effect on restart. On boot, `migrate deploy` and the
seed both run and both no-op against this database.

## 4. Re-upload the background scan

The scanned template image is a **file on the uploads volume**, not inside the database — the
DB only stores its filename. So after the swap, the preview shows no background until you
re-add it:

1. Sign in, go to **Templates → Calibrate**.
2. **Upload / replace** your blank-diploma scan.

Because the template id came across in the DB, the upload lands at exactly the path the
calibration already expects, and every field lines up.

## 5. Verify

- Sign in. **Your admin password is the one from your local `dev.db`**, not the
  `ADMIN_PASSWORD` in Coolify's env — the seed does not overwrite an existing admin. Change it
  after first login.
- **Students** list shows your students.
- Open a diploma: fields sit where you calibrated them, and the QR scans.
- The `app.db.replaced-*` backup stays on the volume until you delete it.

## If production later has data you must keep

This whole-file method overwrites everything, so it is a one-time, fresh-DB move. Once staff
are entering data in production, use [`production-data-update.md`](production-data-update.md)
for students, and move only calibration by exporting the `FieldDefinition` rows rather than
replacing the file.
