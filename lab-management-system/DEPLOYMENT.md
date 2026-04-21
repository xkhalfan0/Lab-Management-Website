# Lab Management System — deployment guide

This document describes how to run **lab-management-system** on a new server or platform (VPS, Kubernetes, PaaS, etc.). All paths are relative to the **`lab-management-system`** folder (the directory that contains `package.json`).

---

## 1. What you are deploying

- **Single Node.js process** (Express) that:
  - Serves the **tRPC API** at `/api/trpc`
  - Serves the **React SPA** (static files from `dist/public` after `pnpm run build`)
  - Handles auth, PDF generation (Puppeteer), SSE, etc.
- **MySQL-compatible database** (MySQL 8.x, MariaDB 10.5+, or TiDB with MySQL protocol). The app uses **Drizzle ORM** with dialect `mysql` (`drizzle.config.ts`).

There is **no Dockerfile** in this repository; use the steps below on any Linux VM or container image you provide.

---

## 2. Software to install on the host

| Requirement | Notes |
|---------------|--------|
| **Node.js** | **20 LTS** or **22 LTS** (recommended). The stack uses React 19, Vite 7, TypeScript 5.9 — use a current Node. |
| **pnpm** | **10.x**. The repo declares `"packageManager": "pnpm@10.4.1"` and uses **pnpm patches** (`patches/wouter@3.7.1.patch`). **Do not use `npm install` or `yarn`** for production installs; use `pnpm` only. |
| **MySQL-compatible server** | Accessible from the app host. Create an empty **database** and a **user** with `CREATE`, `ALTER`, `INDEX`, `SELECT`, `INSERT`, `UPDATE`, `DELETE` on that database (migrations create tables). |
| **Git** | To clone the repository. |
| **Build toolchain (Linux only)** | For native modules (e.g. Puppeteer’s dependencies on some distros): `build-essential`, `python3` if prompted. On minimal images, install **Chromium** dependencies if PDF generation fails (see §9). |

Optional:

- **Nginx** (or another reverse proxy) for HTTPS and routing to the Node port.
- **Process manager**: `systemd`, **PM2**, or platform-native (e.g. Railway, Render, Fly.io).

---

## 3. Database

1. Create a database, e.g. `lab_management`.
2. Use **utf8mb4** collation (recommended for Arabic text).
3. Note **host**, **port** (default `3306`), **user**, **password**, and **database name** for `DATABASE_URL`.

**Local MySQL via Docker:** this repo includes **`docker-compose.yml`** (MySQL 8 only). From `lab-management-system` run `docker compose up -d`, then use the default `DATABASE_URL` shown in **`README.md`**. Change `MYSQL_ROOT_PASSWORD` in `docker-compose.yml` for anything beyond a single developer machine.

Example connection string:

```text
mysql://USER:PASSWORD@HOST:3306/lab_management
```

Special characters in the password must be **URL-encoded** in `DATABASE_URL` (e.g. `@` → `%40`).

---

## 4. Exact replica: same database and environment as your current machine

Use this when you want the **new server to match what you have locally** (same rows in MySQL, same behavior), not an empty DB filled only by migrations + seeds.

### 4.1 Full database copy (recommended for “exact same DB”)

A **logical backup** with `mysqldump` copies **schema + data** in one file: all tables (users, samples, orders, `test_types`, contracts, Drizzle’s migration history, etc.).

**On your current machine** (adjust user, host, database name to match your `.env`):

```bash
mysqldump -h localhost -P 3306 -u YOUR_USER -p \
  --single-transaction \
  --routines \
  --triggers \
  --set-gtid-purged=OFF \
  --default-character-set=utf8mb4 \
  lab_management > lab_management_full_backup.sql
```

- Replace `lab_management` with your actual database name from `DATABASE_URL`.
- `--single-transaction` gives a consistent InnoDB snapshot (use when tables are InnoDB).
- If you use **TiDB** or a hosted MySQL variant, follow their docs for `mysqldump` compatibility; some flags differ.

**On the new server**, create an empty database (utf8mb4), then import:

```bash
mysql -h NEW_HOST -P 3306 -u NEW_USER -p -e "CREATE DATABASE IF NOT EXISTS lab_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -h NEW_HOST -P 3306 -u NEW_USER -p lab_management < lab_management_full_backup.sql
```

**After a full import you usually do *not* run `pnpm run db:migrate`** — the dump already contains the schema and Drizzle’s migration records. Only run migrations if you intentionally deploy **newer** app code that adds migrations your dump does not include.

### 4.2 Match `.env` to your local setup (except connection details)

To behave like your PC, copy your **local `.env`** to the server and change only what must differ:

| Variable | What to do |
|----------|------------|
| `DATABASE_URL` | Point to the **new** DB host, user, password, database name. |
| `PORT` | Set if the server should not use `3000`. |
| `JWT_SECRET` | Use the **same** value as local if you want existing exported tokens/cookies to behave the same; for a **fresh** production server, generating a new secret is safer (users log in again). |
| `VITE_*` | Same values as local if you want the same OAuth/app-id/map behavior — then run **`pnpm run build`** on the server after setting them. |
| `BUILT_IN_FORGE_API_URL` / `BUILT_IN_FORGE_API_KEY` | **Same as local** if you use the Forge storage proxy: attachment rows in MySQL store paths/keys that resolve through this service; different keys = existing uploads may not open. |

**Never commit** real `.env` files to git.

### 4.3 Files are not only in MySQL

- **Attachments** are uploaded via `server/storage.ts` to the **Forge storage API** (`BUILT_IN_FORGE_API_URL` + `BUILT_IN_FORGE_API_KEY`). The database stores metadata and keys; the **binary files** live in that external storage. Replicating “everything” means **same storage account/config** as local, not only the SQL dump.
- **PDFs** are generated on demand with Puppeteer; nothing to copy for “same PDF feature” beyond installing Chromium deps (§9).

### 4.4 Application bits you still deploy from git

Even with an identical DB, on the new host you still:

1. Clone the **same commit** of the repo (or your release tag).
2. `pnpm install --frozen-lockfile`
3. Set `.env` (see §4.2).
4. `pnpm run build` (with the same `VITE_*` you want baked into the UI).
5. `pnpm start` (with `NODE_ENV=production`).

You do **not** copy `node_modules` or `dist` from your PC — rebuild on the server or in CI.

### 4.5 If you cannot use mysqldump

Less exact: run **`pnpm run db:migrate`** on an empty database, then run seeds/imports in the same order you used locally (`db:seed:test-types`, `db:import:catalog`, `db:import:contracts-sql`, etc.). That reproduces **structure + seed data**, not necessarily every sample/order row you have locally.

---

## 5. Environment variables

Create a **`.env`** file in the **`lab-management-system`** root (same folder as `package.json`), or inject the same variables in your orchestration platform.

### Required for production

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | MySQL connection URL (see §3). Required for the app **and** for `pnpm run db:migrate`. |
| `JWT_SECRET` | Secret for signing session/JWT cookies. Use a long random string; **never commit** real values. |
| `NODE_ENV` | Set to `production` when running `pnpm start`. |

### Strongly recommended

| Variable | Purpose |
|----------|---------|
| `PORT` | HTTP port for the Express server (default **3000** if unset). The server may pick the next free port if `PORT` is busy (see `server/_core/index.ts`). |
| `VITE_APP_ID` | Application id string (also baked into the **client** at build time — see §6). |

### Optional (feature-dependent)

| Variable | Purpose |
|----------|---------|
| `OAUTH_SERVER_URL` | External OAuth server base URL (if using OAuth login). |
| `OWNER_OPEN_ID` | Owner account OpenID for OAuth flows. |
| `VITE_OAUTH_PORTAL_URL` | If set, the SPA uses it for login redirect; if empty, local `/login` is used (`client/src/const.ts`). Must be available **at build time** if you use it. |
| `VITE_FRONTEND_FORGE_API_KEY` / `VITE_FRONTEND_FORGE_API_URL` | Optional map/Forge features (`client/src/components/Map.tsx`). |
| `BUILT_IN_FORGE_API_URL` / `BUILT_IN_FORGE_API_KEY` | Referenced in `server/_core/env.ts` for server-side Forge usage if enabled. |

### AWS S3 (if your deployment uses S3 for attachments)

The codebase includes `@aws-sdk/client-s3`; configure standard AWS env vars (`AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, bucket names) **only if** your fork uses S3 — confirm in your deployment’s storage module.

---

## 6. Build-time vs runtime (Vite)

Variables prefixed with **`VITE_`** are embedded when you run **`pnpm run build`**. If you change `VITE_APP_ID`, `VITE_OAUTH_PORTAL_URL`, or map keys, **rebuild** the client (`pnpm run build`) before deploying.

Server-only variables (`DATABASE_URL`, `JWT_SECRET`, `PORT`, `NODE_ENV`) are read at **runtime** from `.env` via `dotenv/config` in `server/_core/index.ts`.

---

## 7. First-time setup (commands)

If you already **imported a full SQL backup** (§4.1), skip **`pnpm run db:migrate`** and the seed/import commands below unless you are intentionally updating only part of the data.

Run from **`lab-management-system`**:

```bash
# 1) Install dependencies (use lockfile for reproducible builds)
pnpm install --frozen-lockfile

# 2) Apply database migrations (requires DATABASE_URL in .env) — skip if DB came from a full dump
pnpm run db:migrate
```

Optional data steps (order can depend on your process):

```bash
# Test catalog (codes, names, unitPrice) — recommended for Reception
pnpm run db:seed:test-types

# Optional: users / contractors — only if your repo documents these scripts
pnpm run db:seed:users
pnpm run db:seed:contractors

# Optional: sectors / contractors / contracts from JSON (see server/data/)
pnpm run db:import:catalog

# Optional: full SQL export for sectors/contractors/contracts
pnpm run db:import:contracts-sql
```

Then build and run:

```bash
# 3) Production build (Vite client → dist/public, bundle server → dist/index.js)
pnpm run build

# 4) Start production server
cross-env NODE_ENV=production node dist/index.js
```

On Linux/macOS you can use:

```bash
export NODE_ENV=production
node dist/index.js
```

`package.json` defines:

```text
"start": "cross-env NODE_ENV=production node dist/index.js"
```

So **`pnpm start`** is equivalent if `NODE_ENV` is set by `cross-env` inside the script.

---

## 8. What each script does (reference)

| Script | Description |
|--------|-------------|
| `pnpm run dev` | Development: `tsx watch server/_core/index.ts` + Vite middleware (hot reload). |
| `pnpm run build` | `vite build` (outputs to **`dist/public`**) + **esbuild** bundles **`server/_core/index.ts`** → **`dist/index.js`**. |
| `pnpm start` | Runs **`dist/index.js`** with `NODE_ENV=production` (serves static SPA from built assets). |
| `pnpm run db:migrate` | Runs **Drizzle migrations** in `drizzle/*.sql` against `DATABASE_URL`. |
| `pnpm run db:push` | Generates new migration from schema + migrates (developer workflow; avoid on production unless intended). |
| `pnpm run db:seed:test-types` | Upserts rows into **`test_types`** (catalog + prices). |
| `pnpm run db:import:contracts-sql` | Executes **`server/data/contracts_catalog.sql`** against `DATABASE_URL` (optional catalog data). |

---

## 9. PDF generation (Puppeteer)

`server/pdfGenerator.ts` uses **Puppeteer** (bundles Chromium). On **minimal Linux** servers, PDF routes may fail until system libraries for Chromium are installed. Typical Debian/Ubuntu packages:

```bash
sudo apt-get update && sudo apt-get install -y \
  ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 \
  libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 \
  libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 \
  libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 \
  libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 wget xdg-utils
```

The launch args already include `--no-sandbox` and `--disable-setuid-sandbox` for containerized environments.

---

## 10. Reverse proxy (example: Nginx)

Point your proxy to the Node **`PORT`** (e.g. 3000):

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

SSE endpoints: `/api/notifications/stream` and `/api/notifications/sector-stream` — keep **long timeouts** if you see disconnects behind a proxy.

---

## 11. Health check

There is no dedicated `/health` route in the stock `server/_core/index.ts`. For load balancers, use **`GET /`** (SPA) or probe **`GET /api/trpc`** with a valid tRPC request, depending on your policy.

---

## 12. Checklist before go-live

- [ ] `DATABASE_URL` correct; DB user can run migrations.
- [ ] `pnpm run db:migrate` completed without errors.
- [ ] `JWT_SECRET` set to a strong secret.
- [ ] `pnpm run build` succeeded; **`dist/public`** and **`dist/index.js`** exist.
- [ ] `NODE_ENV=production` for `pnpm start`.
- [ ] `VITE_*` variables set **before** build if OAuth/maps are required.
- [ ] Firewall / security group allows traffic on `PORT` (or only to reverse proxy).
- [ ] PDF tested if you rely on reports (Puppeteer deps on Linux).

---

## 13. Windows vs Linux

Developers on **Windows** can run the app locally with the same commands (**pnpm**, **Node**). Production deployment is usually **Linux**; the commands above assume a POSIX shell. On Windows Server, use PowerShell equivalents or run the app inside **WSL2** / a **Linux container**.

---

*Last updated to match `package.json` scripts and `server/_core/index.ts` behavior. Adjust if your fork adds Docker, CI, or extra services.*
