# Next.js + Supabase Starter App (Made by me, Natalia Lewis)

A reusable starter application that integrates **Next.js** with **Supabase**, providing authentication, user profiles, avatar storage, and database security out of the box. Use it as a foundation for new projects to save time and keep patterns consistent.

---

## Table of Contents

- [Project Description and Purpose](#project-description-and-purpose)
- [Prerequisites](#prerequisites)
- [Quick Start (Setup Script)](#quick-start-setup-script)
- [Manual Setup](#manual-setup)
- [Project Structure](#project-structure)
- [How to Use This Starter for New Projects](#how-to-use-this-starter-for-new-projects)
- [Environment Variables](#environment-variables)
- [Database Schema Overview](#database-schema-overview)
- [Authentication Flow](#authentication-flow)
- [Deployment (Vercel)](#deployment-vercel)
- [GitHub Actions: Database Migrations](#github-actions-database-migrations)
- [Unit Testing](#unit-testing)
- [Troubleshooting](#troubleshooting)

---

## Project Description and Purpose

This starter app includes:

- **Next.js 16** (App Router) with **TypeScript** and **Tailwind CSS**
- **Supabase** for auth, Postgres database, and Storage (avatars)
- **User authentication**: sign up, sign in, sign out
- **Profiles table** with automatic row creation on signup and RLS
- **Protected routes** (dashboard, profile) with redirect to login when unauthenticated
- **Profile page** with editable name fields and avatar upload/delete (Supabase Storage)
- **Session handling** via Supabase SSR and token refresh logic in `proxy.ts`
- **Setup script** (`setup.sh`) to install deps, start Supabase, write env, and run migrations
- **Unit tests** (Jest + React Testing Library) for auth, hooks, and components

All database changes are done through **migrations**; the profile table is also defined in a **declarative schema** in `supabase/schemas/profiles.sql` for reference and diff-based migration generation.

---

## Prerequisites

- **Node.js** 18+ (recommend 20+)
- **npm** (or yarn/pnpm)
- **Docker** (required for local Supabase: [Docker Desktop](https://www.docker.com/products/docker-desktop/) or equivalent)
- **Git** (for cloning and optional CI/CD)

Ensure Docker is running before using the setup script or running Supabase commands.

---

## Quick Start (Setup Script)

The fastest way to get running:

1. **Clone the repo** (or unzip the project). Do **not** delete the `supabase/` directory.

2. **Run the setup script** (idempotent; safe to run multiple times):

   ```bash
   chmod +x setup.sh   # only needed once
   ./setup.sh
   ```

   The script will:

   - Check that `supabase/` and `supabase/migrations/` exist
   - Run `npm install`
   - Start the local Supabase stack (`npx supabase start`), or continue if already running
   - Extract **API URL** and **anon key** from `npx supabase status -o env`
   - Create or **overwrite** `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Run `npx supabase db reset` to apply all migrations

3. **Start the app**:

   ```bash
   npm run dev
   ```

4. Open **http://localhost:3000**, then sign up or log in and try the dashboard and profile (including avatar upload).

If the script fails, see [Troubleshooting](#troubleshooting). If you prefer to set things up by hand, use [Manual Setup](#manual-setup).

---

## Manual Setup

If you prefer not to use the setup script:

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start Supabase**

   ```bash
   npx supabase start
   ```

   Ensure Docker is running. Note the **API URL** and **anon key** from the output (or run `npx supabase status -o env`).

3. **Create `.env.local`** in the project root:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key-from-supabase-status>
   ```

   Get the anon key with: `npx supabase status -o env` and use the `ANON_KEY` value.

4. **Apply migrations**

   ```bash
   npx supabase db reset
   ```

   Or, to only run pending migrations: `npx supabase migration up`.

5. **Run the app**

   ```bash
   npm run dev
   ```

---

## Project Structure

```
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (Header, ProfileProvider)
│   ├── page.tsx                  # Home (/)
│   ├── login/page.tsx            # Login
│   ├── signup/page.tsx           # Sign up
│   ├── dashboard/page.tsx        # Dashboard (protected)
│   ├── profile/
│   │   ├── page.tsx              # Profile (protected)
│   │   └── components/
│   │       └── ProfileAvatar.tsx # Avatar UI + upload/delete
│   └── settings/page.tsx         # Settings (protected)
├── components/
│   ├── header/
│   │   ├── Header.tsx            # Site header (logo, AuthNav, ThemeToggle)
│   │   └── AuthNav.tsx           # Login/signup links or user menu + avatar
│   ├── auth/
│   │   ├── AuthPage.tsx          # Layout for login/signup pages
│   │   └── LogoutButton.tsx     # Sign-out button
│   └── ui/
│       ├── ThemeToggle.tsx       # Light/dark theme
│       └── PasswordInput.tsx     # Password field with show/hide
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client (client components)
│   │   └── server.ts             # Server Supabase client (server components)
│   ├── hooks/
│   │   ├── useAuth.ts            # Current user + loading (client)
│   │   ├── useLogin.ts           # Login action + error
│   │   ├── useSignUp.ts          # Sign up action + error
│   │   ├── useLogout.ts          # Logout action
│   │   ├── useProfile.ts         # Profile from context (client)
│   │   └── useProfileImageUpload.ts  # Avatar upload/delete
│   ├── contexts/
│   │   └── ProfileContext.tsx    # Shared profile state + refetch
│   ├── auth.ts                  # getUser() for server (redirects if not authenticated)
│   ├── resizeImage.ts            # Client-side image resize for avatars
│   └── date.ts                  # Date formatting helpers
├── supabase/
│   ├── config.toml              # Local Supabase config
│   ├── schemas/
│   │   ├── profiles.sql         # Declarative profile table + RLS (reference)
│   │   └── functions.sql        # Helper functions (e.g. update_updated_at)
│   └── migrations/              # All schema changes (apply with db reset or migration up)
├── proxy.ts                     # Session refresh + protected route redirect logic
├── setup.sh                     # One-command setup (install, start Supabase, env, migrations)
├── jest.config.ts               # Jest + next/jest
├── jest.setup.ts                # @testing-library/jest-dom
└── README.md                    # This file
```

**Conventions:**

- **Reusable UI:** `components/` (e.g. `components/ui/` for buttons, inputs, theme toggle).
- **Custom hooks:** `lib/hooks/` (e.g. `useAuth`, `useProfile`, `useLogin`, `useSignUp`, `useLogout`, `useProfileImageUpload`).
- **Utilities:** `lib/` (e.g. `lib/auth.ts`, `lib/date.ts`, `lib/resizeImage.ts`).
- **Supabase:** `lib/supabase/` for server and client helpers; `proxy.ts` for refresh and auth-based redirect.

---

## How to Use This Starter for New Projects

1. **Copy or clone** this repo. Keep the `supabase/` directory (migrations and schemas).
2. **Run** `./setup.sh` (or follow [Manual Setup](#manual-setup)) to install deps, start Supabase, create `.env.local`, and run migrations.
3. **Rename the project** in `package.json` and adjust app name/branding (e.g. logo, "Starter App" text in the header).
4. **Add or change features**: new tables via declarative schemas in `supabase/schemas/`, then `npx supabase db diff -f <name>` and apply migrations; new routes under `app/`; new components under `components/` or `app/<route>/components/`.
5. **Deploy** to Vercel (or another host), point to a **production** Supabase project, and set env vars as in [Deployment](#deployment-vercel). Use GitHub Actions (or your CI) to run migrations on deploy as in [GitHub Actions](#github-actions-database-migrations).

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (e.g. `http://127.0.0.1:54321` locally). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous (public) key for client-side auth and API access. |

- **Local:** The setup script writes these to `.env.local` from `npx supabase status -o env`.
- **Production:** Set them in your hosting platform (e.g. Vercel) from the Supabase project settings.
- **Security:** Do **not** commit `.env.local` or expose the **service_role** key in client or frontend code; use only the anon key in the app.

---

## Database Schema Overview

### Profiles table

Defined declaratively in `supabase/schemas/profiles.sql` and applied via migrations:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID, PK | References `auth.users(id)` ON DELETE CASCADE. |
| `first_name` | TEXT | User’s first name. |
| `last_name` | TEXT | User’s last name. |
| `email` | TEXT, UNIQUE | User’s email (from auth). |
| `avatar_url` | TEXT, nullable | Public URL of profile image (Supabase Storage). |
| `updated_at` | TIMESTAMPTZ | Set automatically by trigger on UPDATE. |
| `created_at` | TIMESTAMPTZ | Set on INSERT. |

- **RLS:** Enabled. Users can **SELECT**, **UPDATE**, and **INSERT** only the row where `id = auth.uid()`.
- **Trigger:** `set_updated_at` runs BEFORE UPDATE and sets `updated_at` to `NOW()`.
- **Auto profile:** Trigger `on_auth_create_user` runs AFTER INSERT on `auth.users` and inserts one row into `profiles` with `id`, `email`, and `first_name`/`last_name` from `raw_user_meta_data` (signup form).

### Storage (avatars)

- **Bucket:** `avatars` (public).
- **RLS on `storage.objects`:** Authenticated users can INSERT/UPDATE/DELETE only objects under a path whose first segment is their user id (e.g. `{user_id}/avatar.jpg`). SELECT is allowed for everyone so avatar URLs work.

Migrations that touch the schema live under `supabase/migrations/` and are applied with `npx supabase db reset` or `npx supabase migration up`.

---

## Authentication Flow

### Client components

- **`useAuth()`** (`lib/hooks/useAuth.ts`): Returns `{ user, loading }`. Use for conditional UI and to know if someone is signed in.
- **`useProfile()`** (`lib/hooks/useProfile.ts`): Returns profile from shared context (`ProfileContext`). Requires `ProfileProvider` in the tree (wraps the app in `app/layout.tsx`).
- **`useLogin()`** / **`useSignUp()`** / **`useLogout()`**: Call `login()`, `signUp()`, or `logout()`; handle loading and error in the UI.

### Server components / server-side

- **`getUser()`** (`lib/auth.ts`): Async. Returns the current user or **redirects to `/login`** if not authenticated. Use in server components or route handlers that require auth.

### Protected routes

- **Logic in `proxy.ts`:** Uses the Supabase server client with request cookies to get the user. Paths `/`, `/login`, and `/signup` are treated as public; all other paths require an authenticated user and redirect to `/login` if not signed in. The same module refreshes session cookies via the Supabase client.
- **Page-level guard:** Protected pages (e.g. dashboard, profile) can also use `getUser()` or client-side `useAuth()` and redirect when `!user`.

### Public routes

- **`/`** – Home: welcome, auth status, links to login/signup or dashboard.
- **`/login`** – Email/password login; redirect to dashboard on success.
- **`/signup`** – Email/password signup (with first/last name in metadata); redirect to dashboard on success.

Protected routes (e.g. `/dashboard`, `/profile`, `/settings`) require authentication and redirect to `/login` when the user is not signed in.

---

## Deployment (Vercel)

### 1. Production Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**: copy **Project URL** and **anon public** key.
3. Run migrations against the production DB:
   - **Option A:** Link the repo with `npx supabase link --project-ref <ref>` and run `npx supabase db push` (or use CI; see below).
   - **Option B:** Apply the SQL in `supabase/migrations/` in order via the Supabase SQL editor or CLI.

### 2. Vercel

1. Import the repo in Vercel and create a project.
2. In **Settings → Environment Variables** add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your production Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your production anon key
3. Redeploy so the build uses these variables.

### 3. Linking production database

- Use Supabase **Dashboard → SQL** or `supabase db push` (after `supabase link`) to ensure all migrations from `supabase/migrations/` are applied to the production database. The GitHub Actions workflow (below) can run migrations on push/deploy.

### 4. Notes

- Do not commit `.env.local` or production keys.
- Use only the **anon** key in the Next.js app; never expose the **service_role** key in the frontend or client bundle.

---

## GitHub Actions: Database Migrations

The repo includes `.github/workflows/migrate.yml`, which runs pending Supabase migrations on every push to `main`.

### What the workflow does

1. Checks out the repo.
2. Installs the Supabase CLI (`supabase/setup-cli@v1`).
3. Links the local project to your production Supabase project using `SUPABASE_PROJECT_REF` and `SUPABASE_ACCESS_TOKEN`.
4. Runs `npx supabase db push` to apply any new migrations, using `SUPABASE_DB_PASSWORD` when prompted for the database password.

### Required GitHub Secrets

In **GitHub → Repository → Settings → Secrets and variables → Actions**, add:

| Secret | Description |
|--------|-------------|
| **`SUPABASE_ACCESS_TOKEN`** | [Create a token](https://supabase.com/dashboard/account/tokens) under Account → Acount Preferences → Access Tokens. Used by the CLI to link the project. |
| **`SUPABASE_PROJECT_REF`** | Your project reference ID. In the Supabase dashboard URL it is the segment after `/project/` (e.g. `https://supabase.com/dashboard/project/abcdefghij` → use `abcdefghij`). |
| **`SUPABASE_DB_PASSWORD`** | The database password you set when creating the Supabase project. |

### Setup steps

1. Create a production Supabase project at [supabase.com](https://supabase.com) (if you haven’t already).
2. In Supabase: **Account → Access Tokens** → generate a token. Add it as the `SUPABASE_ACCESS_TOKEN` secret in GitHub.
3. Copy the project ref from the dashboard URL and add it as `SUPABASE_PROJECT_REF`.
4. Add the project’s database password as `SUPABASE_DB_PASSWORD`.
5. Push to `main` (or merge a PR into `main`). The workflow will run; check the **Actions** tab for success or errors.

### Security and errors

- The workflow does not echo or log any of the secrets. Do not add `echo` or debug logs that expose them.
- If the job fails, fix the error from the Actions log (e.g. wrong project ref, invalid token, or migration SQL errors). Never commit secrets or tokens into the repo.

---

## Unit Testing

Tests use **Jest** and **React Testing Library**, with `next/jest` for Next.js compatibility.

### Run tests

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

### What’s tested

- **`lib/auth.test.ts`** – `getUser()` redirects when unauthenticated and returns the user when authenticated (mocked Supabase and `redirect`).
- **Hooks** – `useAuth`, `useLogin`, `useSignUp`, `useLogout`, `useProfile`, `useProfileImageUpload` (mocked Supabase/router/profile context as needed).
- **Components** – `LogoutButton`, `AuthPage`, `Header`, `AuthNav`, `ThemeToggle`, `PasswordInput` (rendering, interactions, accessibility).

### Adding new tests

- **Placement:** Next to the source file (e.g. `useAuth.test.tsx` next to `useAuth.ts`) or in a `__tests__` directory, depending on your preference; this repo uses co-located `*.test.ts` / `*.test.tsx`.
- **Pattern:** Mock Supabase with `jest.mock('@/lib/supabase/client')` (or server), mock `next/navigation` for `useRouter`, and use `render` / `renderHook` from `@testing-library/react` with `act` and `waitFor` for async behavior.
- **DOM:** `jest.setup.ts` imports `@testing-library/jest-dom` so you can use matchers like `toBeInTheDocument()`, `toHaveAttribute()`, etc.

---

## Troubleshooting

### Setup script fails: "supabase/ directory not found"

- Run `npx supabase init` first to create `supabase/` and `config.toml`. Then add or copy migrations into `supabase/migrations/` and run `./setup.sh` again.

### "Failed to start Supabase" or Docker errors

- Ensure **Docker** is installed and running (Docker Desktop or daemon).
- See [Supabase local development](https://supabase.com/docs/guides/cli/local-development).

### "Could not parse API_URL or ANON_KEY"

- After `npx supabase start`, run `npx supabase status -o env` and confirm you see `API_URL` and `ANON_KEY`. If the CLI version is different, variable names might differ; adjust the setup script or create `.env.local` manually from the status output.

### Migrations fail (duplicate table, etc.)

- If the DB is in a bad state, run `npx supabase db reset` to recreate the DB and re-apply all migrations from `supabase/migrations/`.

### App works locally but not after deploy

- Confirm **environment variables** are set in the hosting platform (e.g. Vercel) for the production Supabase URL and anon key.
- Ensure **migrations** have been applied to the **production** Supabase database (e.g. via `supabase db push` or GitHub Actions).

### Avatar upload: "new row violates row-level security policy"

- Ensure migrations that create the `avatars` bucket and its RLS policies on `storage.objects` have been applied (`supabase db reset` or `migration up`). The policy allows INSERT only when the path’s first segment is the user’s id (e.g. `{user_id}/avatar.jpg`).

### Tests fail: "useProfileContext must be used within ProfileProvider"

- Components or hooks that call `useProfile()` must be rendered inside `ProfileProvider`. In tests, wrap the component under test with `<ProfileProvider>` (and mock `useAuth` / Supabase as needed).

---

## License

Use this starter for your own projects; adjust license and attribution as needed.
