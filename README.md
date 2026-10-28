# Admin360

CHATTAM 360 Admin (Next.js) — curator UI for the imported Neon question catalog. The browser never receives `ADMIN_DATABASE_URL`; Next.js Route Handlers query Neon with a signed httpOnly session cookie.

## Local

```bash
cp .env.example .env.local
# fill ADMIN_DATABASE_URL, ADMIN_DEV_EMAIL, ADMIN_DEV_PASSWORD, ADMIN_SESSION_SECRET
bun install
bun run dev
```

Open `http://127.0.0.1:5175`. Sign in with `ADMIN_DEV_EMAIL` / `ADMIN_DEV_PASSWORD`.

## Vercel

1. Create a project with root directory `Vakeel360/Admin`.
2. Set server env (Production + Preview):
   - `ADMIN_DATABASE_URL`
   - `ADMIN_DEV_EMAIL`
   - `ADMIN_DEV_PASSWORD`
   - `ADMIN_SESSION_SECRET` (long random string)
   - `ADMIN_ALLOWED_EMAILS` (optional comma-separated allow-list)
3. Deploy. Never use `NEXT_PUBLIC_` for database or password values.

## Notes

- Catalog and repetition views load all imported paper questions from Neon (≈1915 today).
- Import & review validates uploaded files in the browser only; it does not write to the database.
- The Go `/api/v1/admin` routes remain available for local backend workflows but are not required by this app.
