# Life Hub

Life Hub is an all-in-one personal operating system: calendar, tasks & projects, goals, focus sessions, personal finance, notes, habits, and wellbeing — in one calm, premium workspace that adapts to students, employees, freelancers, entrepreneurs, and families alike.

This is a complete, working full-stack application — not a mockup. Every module reads and writes real data through a typed Prisma/SQLite database behind authenticated, workspace-scoped server actions.

## Table of contents

- [Stack](#stack)
- [Architecture](#architecture)
- [Data model](#data-model)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Demo account & seed data](#demo-account--seed-data)
- [Testing](#testing)
- [Project structure](#project-structure)
- [Mobile app](#mobile-app)
- [Known trade-offs & what's next](#known-trade-offs--whats-next)
- [Deployment](#deployment)

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) | Server Components + Server Actions give one coherent mental model for data fetching *and* mutation, no separate REST/GraphQL layer to maintain. |
| Language | TypeScript | End-to-end type safety from the database to the UI. |
| Database | SQLite via Prisma ORM | Zero-config local dev with a real relational schema; the schema deliberately avoids SQLite-only features so switching `DATABASE_URL` to Postgres/MySQL needs no model changes. |
| Auth | Auth.js (NextAuth v5) — Credentials provider + Prisma adapter, JWT sessions | Credentials auth requires JWT sessions in Auth.js; the Prisma adapter still gives us typed `User`/`Account`/`Session` tables ready for OAuth providers later. |
| Validation | Zod | Every server action validates its `FormData` with a schema in `lib/validations/*` before touching the database. |
| Styling | Tailwind CSS v4 (CSS-first config) | Design tokens live as CSS custom properties in `src/app/globals.css`, themeable for light/dark with zero JS-side color logic. |
| Components | Hand-built on Radix UI primitives | Full control over the design system (see [Design system](#design-system)) rather than a black-box component library. |
| Data fetching | Server Components + Server Actions; TanStack Query only where a client needs its own polling/cache (e.g. the notification bell) | Keeps most pages simple `async function Page()` reads with no client-side loading state to manage. |
| Charts | Recharts | Spending breakdown, focus minutes, mood/sleep/water trends. |
| Drag & drop | @dnd-kit (task board), native HTML5 DnD (calendar grid) | dnd-kit's sortable primitives fit a kanban board well; a calendar grid with many small per-cell drop targets was simpler and lighter with native DnD. |
| Markdown | react-markdown + remark-gfm | Notes support GitHub-flavored markdown (tables, checklists) in preview. |
| Testing | Vitest + Testing Library; Playwright (ad hoc, see below) | Pure-logic unit tests for the trickiest parts of each module; a scripted Playwright pass was used to verify the live app end-to-end during development. |

## Architecture

**Everything is workspace-scoped.** A signed-in user can have multiple *workspaces* (Personal, Work, School, Family, Side Project — see onboarding). Every domain table (`Task`, `Event`, `Transaction`, `Note`, `Habit`, …) has a `workspaceId` foreign key, and every query is filtered by it. The active workspace is resolved once, in `src/lib/session.ts`:

```ts
const { userId, user, workspace, workspaces } = await requireWorkspace();
```

This one call: confirms the user is signed in (redirecting to `/login` if not), resolves which workspace is "active" (from a cookie, falling back to the user's default), and redirects to `/onboarding` if the user has none yet. Every protected page and server action starts here.

**Data flow, consistently, everywhere:**

```
page.tsx (Server Component)
   -> lib/services/<module>.ts   (plain async functions, pure data access, no auth logic)
   -> Prisma -> SQLite

Client interaction (form submit / button click)
   -> lib/actions/<module>.ts ("use server"; validates with lib/validations/<module>.ts, calls the service, revalidates the route)
```

Forms follow one pattern throughout the app: a client component calls `useActionState(someAction, null)` from `react`, renders a `<form action={formAction}>`, and a submit button reads `useFormStatus()` for its pending state. The action returns `{ error: string } | { success: true }` (the shared `ActionResult` type). This is the same pattern used for login, registration, onboarding, and every module's create/edit dialogs — one idiom to learn, reused everywhere.

**Auth & route protection** is two-layered:
- `src/proxy.ts` (Next.js 16 renamed `middleware.ts` to `proxy.ts` — see [Known trade-offs](#known-trade-offs--whats-next)) does a cheap JWT-only check and redirects unauthenticated users away from protected routes, and signed-in users away from `/login`/`/register`/`/`.
- `src/app/(app)/layout.tsx` does the heavier check — onboarding completion, workspace resolution — since it runs in the Node.js runtime and can safely query Prisma.

### Design system

Design tokens are CSS custom properties (`--brand`, `--surface`, `--radius-md`, `--shadow-sm`, …) defined once in `src/app/globals.css` and consumed via Tailwind v4's `@theme inline` block, so `bg-[var(--surface)]` resolves through the token, not a hardcoded value. Dark mode is `next-themes` toggling a `data-theme` attribute; every token has a light and dark definition. The component kit (`src/components/ui/*`) wraps Radix primitives (Dialog, DropdownMenu, Select, Tabs, Tooltip, Popover, Checkbox, Switch, …) plus a few hand-built pieces (`EmptyState`, `ErrorState`, `StatCard`, `Skeleton`) — every list view in the app uses these three for its zero-items, error, and loading states.

## Data model

The full schema lives in [`prisma/schema.prisma`](prisma/schema.prisma). Highlights:

- **Auth**: `User`, `Account`, `Session`, `VerificationToken` (Auth.js Prisma adapter shape) plus `OnboardingProfile`, `UserSettings`, `NotificationPreference`.
- **Workspaces**: `Workspace` (typed Personal/Work/School/Family/Side-Project), owning nearly every other table.
- **Calendar**: `Event`, with a JSON-encoded recurrence rule (`{freq, interval, byWeekday?, until?}`) expanded on demand by a pure, unit-tested `expandRecurrence()` function rather than exploding into per-occurrence rows.
- **Tasks & projects**: `Task` (self-referencing for subtasks via `parentTaskId`), `Project`, `Tag` (many-to-many with both tasks and notes), `Attachment` (URL-based link attachments, not binary uploads — see trade-offs).
- **Goals**: `Goal` + `Milestone`; progress is computed, not stored (milestones-complete ratio, falling back to linked-tasks-complete ratio).
- **Focus**: `FocusSession` (Pomodoro/deep-work/custom), durations configurable per-user via `UserSettings`.
- **Finance**: `Transaction`, `Category`, `Budget`, `RecurringBill`, `SavingsGoal` — all money stored as **integer cents** to avoid floating-point drift.
- **Notes**: `Note` (markdown content, optional `NoteFolder` nesting, optional `Project` link), `NoteChecklistItem`.
- **Habits & wellbeing**: `Habit` (JSON-encoded active days-of-week), `HabitLog`, `MoodCheckIn`, `WellbeingLog` (sleep/exercise/water).
- **Notifications**: `Notification` + `NotificationPreference`, described below.

## Getting started

```bash
git clone <this-repo>
cd lifehub                    # or wherever you cloned it
npm install
cp .env.example .env          # then set AUTH_SECRET — see below
npx prisma migrate deploy     # applies the committed migration history, creating prisma/dev.db
npm run db:seed               # populates it with a realistic demo account
npm run dev                   # http://localhost:3000
```

(If you'd rather start from a blank database and iterate on the schema yourself, use `npx prisma migrate dev` instead of `deploy`.)

Sign in with the seeded demo account (below), or register a new account and go through onboarding yourself.

## Environment variables

See [`.env.example`](.env.example) for the full list with comments. Summary:

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | `file:./dev.db` for local SQLite. Point at a Postgres/MySQL connection string in production — no schema changes needed. |
| `AUTH_SECRET` | Yes | Session encryption key for Auth.js. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. |
| `NEXTAUTH_URL` | Recommended | Base URL of the deployed app (used for OAuth callback URLs if you add a provider later). |
| `MOBILE_JWT_SECRET` | Yes | Signs bearer tokens for the mobile app's API (`src/lib/mobile/jwt.ts`) — deliberately a *different* secret than `AUTH_SECRET`. Generate the same way. See [Mobile app](#mobile-app). |

`src/lib/env.ts` validates these with Zod at startup and throws a clear error if any are missing — fail fast rather than surfacing a confusing runtime error deep in a request.

## Demo account & seed data

```
demo@lifehub.app / Demo12345
```

Running `npm run db:seed` (safe to re-run — it deletes and recreates just this account) gives that account **three workspaces** (Personal, Work, Side Project) populated with ~90 days of realistic finance transactions, a dozen tasks and subtasks across several projects, goals with milestones (some already completed), a recurring weekly calendar event plus one-off events, two weeks of focus session history, pinned/tagged notes with checklists, four habits with 30 days of (intentionally imperfect) completion history, and 30 days of mood/wellbeing logs — so the app looks and feels used, not empty, the first time you open it.

Brand-new sign-ups go through onboarding instead: pick the areas you want to manage (Work / Education / Personal / Finances / Health), and the app seeds a *small* set of starter content scoped to what you picked (`src/lib/services/onboarding.ts`) rather than the full demo dataset — enough to not feel empty, not so much that it feels fake.

## Testing

```bash
npm test          # vitest run — one-shot
npm run test:watch
```

59 tests across the trickiest *pure* logic in each module — deliberately not database-dependent, so they run instantly with no test DB setup:

- Auth/validation schemas (`lib/validations/auth.test.ts`)
- Recurrence expansion for the calendar — daily/weekly/by-weekday/interval/end-date cases (`lib/services/events.test.ts`)
- Subtask progress, goal progress, workspace-delete guard, focus timer phase-cycling & clock formatting, budget dollar-parsing, habit streak calculation (gap + active-streak cases), markdown-to-snippet stripping — one test file per module, colocated next to the function it tests.

Plus 18 more covering the mobile API specifically (see [Mobile app → Testing](#mobile-app)): 5 pure token-signing tests (`lib/mobile/jwt.test.ts`) and 13 integration tests (`app/api/mobile/v1/mobile-api.test.ts`) that run the real route handlers against a disposable SQLite database — login/refresh/logout, refresh-token rotation and reuse-detection, and, most importantly, that one signed-in user can't read or delete another user's workspace data.

**Manual/browser verification:** critical flows (registration → onboarding → dashboard, every module's page, sign-out/sign-in as the demo account, mobile viewport at 390px) were driven end-to-end with a scripted Playwright pass during development, checking for console/page errors after every navigation. `@playwright/test` is included as a dev dependency if you want to write your own e2e suite against `npm run dev`; none is checked in, since the ad hoc script was a verification tool, not a maintained suite.

## Project structure

The repo is an npm-workspaces monorepo: this Next.js app at the root, plus `apps/mobile` (Expo) and `packages/shared` (contracts shared between them) — see [Mobile app](#mobile-app) below.

```
prisma/
  schema.prisma       # full data model, incl. mobile-only MobileSession/PushToken tables
  seed.ts             # demo account + realistic data
src/
  app/
    (auth)/           # /login, /register — centered card layout
    (app)/            # every authenticated route, behind the app shell
      dashboard/ calendar/ tasks/ projects/ goals/ focus/
      finance/{transactions,budgets,bills,savings,categories}/
      notes/ habits/ settings/
    onboarding/
    api/
      auth/[...nextauth]/
      mobile/v1/      # versioned JSON API for apps/mobile — see its own README.md
  components/
    ui/               # design-system primitives (Button, Card, Dialog, ...)
    layout/           # app shell, sidebar, topbar, notifications bell
    <module>/         # one folder per feature module, mirrors app/(app)/<module>
  lib/
    actions/<module>.ts       # "use server" — validate, call service, revalidate
    services/<module>.ts      # plain async data-access functions
    validations/<module>.ts   # zod schemas
    mobile/                    # JWT signing, refresh-token rotation, request-auth — used only by app/api/mobile/v1/**
    session.ts                # requireWorkspace()
    streaks.ts                # pure streak math (no Prisma import — safe for client components)
  auth.ts             # Auth.js config
  proxy.ts            # route protection (formerly middleware.ts)
apps/mobile/          # Expo Router (iOS/Android) app
packages/shared/      # @lifehub/shared — types + Zod contracts shared by the mobile app and app/api/mobile/v1
```

## Mobile app

`apps/mobile` is a React Native + Expo (SDK 57) + TypeScript app for iOS and Android sharing this same data model — it never talks to Prisma/SQLite directly. Every read/write goes through a versioned JSON API at `src/app/api/mobile/v1/**` (Next.js Route Handlers), which itself just calls into the same `lib/services/*` functions the web app uses (adding a couple of new ones: `startFocusSession`/`endFocusSession`, `listHabitsWithProgress`). The contract those routes follow (response envelope, auth header, workspace-scoping rules) is documented in [`src/app/api/mobile/v1/README.md`](src/app/api/mobile/v1/README.md).

### Architecture

```
apps/mobile/src/
  app/                       # Expo Router routes (file-based)
    _layout.tsx              # React Query (+ AsyncStorage persistence) and auth providers, splash screen
    sign-in.tsx              # public
    (app)/                   # Stack.Protected — only reachable once signed in
      (tabs)/                # bottom tabs: Today, Plan, Focus, Finance, More
      task/[id].tsx  event/[id].tsx  note/[id].tsx
      habits.tsx  notes.tsx  notifications.tsx  workspaces.tsx  settings.tsx
      modals/                # presentation:"modal" screens — the create flows
  components/ui/             # accessible, theme-aware component kit (Button, Card, TextField, EmptyState, ErrorState, Skeleton, SyncStatusBar, ...)
  features/<domain>/api.ts   # one file per module — React Query hooks over the mobile API
  lib/
    api/client.ts            # fetch wrapper: bearer auth, silent refresh-on-401, NetworkError
    api/query-client.ts      # QueryClient wired to NetInfo (online/offline) + AsyncStorage persistence
    auth/auth-context.tsx    # session state, sign in/out, active workspace
    storage/token-storage.ts # expo-secure-store wrapper
    forms/fire-create-mutation.ts # offline-safe "create" submit pattern (see Offline behavior below)
  theme/                     # design tokens + light/dark hook, mirrors the web app's palette
```

### Authentication

- Sign-in exchanges email/password for a short-lived (15 min) access token plus a rotating refresh token (`src/lib/mobile/jwt.ts`, `src/lib/mobile/refresh-tokens.ts`).
- Tokens are signed with `MOBILE_JWT_SECRET` — deliberately a *different* secret than Auth.js's `AUTH_SECRET`, so the mobile app and the web session cookie can never be confused for one another.
- Refresh tokens are stored server-side only as a SHA-256 hash (`MobileSession` table) and rotate on every use. Presenting an already-rotated (i.e. copied/replayed) refresh token revokes every session on the account, not just that one.
- The app stores both tokens in `expo-secure-store` (Keychain/Keystore) and transparently refreshes on a 401 (`src/lib/api/client.ts`) — callers never see the expiry, only a `NetworkError` if there's genuinely no connectivity.
- There's no mobile sign-up flow in this release: sign in with an account created on the web app, or the demo account below.

### Running it

```bash
# 1. Web app + mobile API, from the repo root
npm install                 # installs the whole workspace: this app, apps/mobile, packages/shared
npx prisma migrate deploy
npm run db:seed
npm run dev                  # http://localhost:3000 — mobile API under /api/mobile/v1

# 2. Mobile app, in a second terminal
cd apps/mobile
cp .env.example .env         # set EXPO_PUBLIC_API_URL — see table below
npm run ios                  # or: npm run android / npm run web
```

`EXPO_PUBLIC_API_URL` has to be reachable from wherever the app actually runs — `localhost` only resolves on the machine it's set on:

| Target | `EXPO_PUBLIC_API_URL` |
| --- | --- |
| iOS Simulator | `http://localhost:3000/api/mobile/v1` |
| Android Emulator | `http://10.0.2.2:3000/api/mobile/v1` |
| Physical device (Expo Go / dev build) | `http://<your-machine's-LAN-IP>:3000/api/mobile/v1` |

Sign in with the same demo account as the web app: `demo@lifehub.app` / `Demo12345`.

### Environment variables

| Variable | Where | Notes |
| --- | --- | --- |
| `MOBILE_JWT_SECRET` | root `.env` | See [Environment variables](#environment-variables) above. |
| `EXPO_PUBLIC_API_URL` | `apps/mobile/.env` | Base URL of `/api/mobile/v1` — see the reachability table above. Gets inlined into the JS bundle at build time, so never put a real secret in an `EXPO_PUBLIC_*` variable. |

### Offline behavior

Reads go through TanStack Query with an `AsyncStorage` persister, so the last-loaded data for a screen survives an app restart and renders immediately while a background refetch runs. Mutations use `networkMode: 'offlineFirst'`: offline, they queue instead of failing, and resume automatically once `@react-native-community/netinfo` reports connectivity again — including across an app restart, via `resumePausedMutations()`. "Create" flows (new task/event/note/transaction) don't block their modal on that round-trip finishing (`src/lib/forms/fire-create-mutation.ts` races a short timeout against the real request, so a slow or offline submit still closes the modal instead of hanging); task-complete and habit-tick toggles are additionally optimistic. A slim banner (`SyncStatusBar`, mounted in every `Screen`) shows "offline" / "syncing N changes" whenever that's true and renders nothing otherwise.

### Testing

```bash
cd apps/mobile
npm run typecheck
npm test             # jest — API client refresh-on-401, the offline-submit helper, a component interaction test
```

From the repo root, `npm test` also covers the mobile *API*: `src/app/api/mobile/v1/mobile-api.test.ts` runs the real route handlers against a disposable SQLite database (created and torn down per run, never touching `prisma/dev.db`) — login, token refresh/rotation/reuse-detection, logout, and cross-user authorization (one signed-in user reading or deleting another user's workspace/tasks). `src/lib/mobile/jwt.test.ts` covers token signing/verification in isolation.

### Known limitations

- **No mobile sign-up/onboarding.** A brand-new web account with zero workspaces shows an empty workspace switcher on mobile — there's nothing to onboard into yet from this app.
- **Push notifications are wired up but unverified.** Permission requests, Android channel setup, token registration (`POST /api/mobile/v1/notifications/push-token`, backed by a new `PushToken` table), and the send path (`src/lib/services/push.ts`, invoked from the same `syncDueNotifications` sweep the web app already runs) are implemented against Expo's documented push HTTP API. Actually sending a token to Expo's push service also needs an EAS project id (`app.json`'s `extra.eas.projectId`), which means running `eas init` against a real Expo account — not done here, so delivery to a physical device has not been tested end-to-end. Enabling the toggle in Settings without that configured explains as much rather than pretending it works.
- **Calendar creation is simplified.** Mobile can create a same-day, non-recurring event (Today/Tomorrow + optional time); recurrence and editing an existing event still need the web app. Viewing correctly expands recurring events created there, though.
- **No project/goal screens.** Tasks show which project they belong to (read-only); there's no mobile UI to manage projects or goals, by design for this release.
- **A queued mutation that later fails for a real (non-network) reason doesn't surface a toast once you've already navigated away** — only the persistent "syncing" banner reflects that something is still pending. A proper toast/notification-center hookup is the natural next step here.
- **Not run on an actual Simulator/Emulator/device.** Verified via `tsc --noEmit`, `jest`, `expo lint`, `npx expo export --platform ios` (bundles cleanly — 3805 modules, zero errors), and the real Next.js dev server + demo account over HTTP, but no iOS Simulator or Android Emulator was available in this environment to launch the app itself. The setup (Expo Router, Metro monorepo config, native module set) is standard and should run as-is; a first real launch is the natural next check before shipping.

## Known trade-offs & what's next

Built to be honest about scope, not to hide corners:

- **No real push notifications.** True web push needs VAPID keys and a deployed HTTPS origin; instead there's a full in-app notification center (bell dropdown, preference toggles per category, mark-read/mark-all-read) with a `syncDueNotifications()` sweep (`src/lib/services/notification-sync.ts`) that runs from the authenticated layout on every request, scanning for due tasks, upcoming event reminders, bills nearing their reminder window, and un-logged habits past their reminder time. There's no background scheduler in this architecture, so "check on read" is the pragmatic substitute for a cron job — the next real step here is a scheduled job (Vercel Cron, a queue worker) calling the same sync function and dispatching real push/email on top of it.
- **Attachments are links, not files.** Task/note/project "attachments" store a name + URL, not an uploaded binary. Wiring up S3/Uploadthing-style storage is a natural extension of the existing `Attachment` model.
- **Single-user workspaces.** A "Family" workspace today is really just a label — there's no multi-member sharing/invites yet. The schema (`Workspace.userId`) would need a join table (`WorkspaceMember`) to support that.
- **`middleware.ts` → `proxy.ts`.** Next.js 16 deprecated the `middleware` file convention in favor of `proxy` (same behavior, Node.js runtime by default instead of Edge). This repo already uses the new convention.
- **SQLite in dev; verified against real Postgres.** `docker-compose.yml` brings up a local Postgres so you can test the production path before deploying: the schema (models, JSON string fields, enums, cascades) applies cleanly with zero changes, `npm run db:seed`'s full realistic dataset writes correctly, and a 50-way concurrent-write + mixed-table smoke test completed with 100% success — SQLite's single-writer lock can't meaningfully exercise that, Postgres's real MVCC concurrency can. One real gotcha found doing this: **you cannot just swap `DATABASE_URL` and run `prisma migrate deploy`.** The committed migration history under `prisma/migrations` was generated against the `sqlite` provider, and Prisma's `migration_lock.toml` refuses to replay a SQLite-authored history against a different provider (`P3019`). Going to Postgres means establishing a **fresh** migration baseline there, not replaying the dev one — see Deployment step 3 below.
- **Password reset emails are logged, not sent.** The forgot-password flow (`/forgot-password` → hashed, single-use, 1-hour token in `PasswordResetToken` → `/reset-password`) is fully implemented and covered by tests, but `src/lib/email.ts` only console-logs the message — there's no real email provider wired up. Swap that one function for Resend/Postmark/SES/SMTP before shipping; nothing else in the flow needs to change.
- **Rate limiting is a fixed-window counter, not a full abuse-defense system.** `src/lib/rate-limit.ts` throttles login (10/15min per email, 30/15min per IP), registration (10/hour per IP), password-reset requests (5/hour per email, 20/hour per IP), and the mobile refresh endpoint (60/15min per IP) via a `RateLimitAttempt` table — database-backed on purpose, so the limit holds across multiple serverless instances the way an in-memory counter wouldn't. It doesn't do anything smarter than that (no CAPTCHA fallback, no exponential backoff, no distributed-attack correlation across IPs) — fine as a baseline, but a dedicated service (Upstash Ratelimit, Cloudflare) is worth it at real scale.

## Deployment

Before a real deploy, you can rehearse all of this locally: `docker compose up -d` starts a local Postgres (see `docker-compose.yml`), so you can run steps 1–3 below against `postgresql://lifehub:lifehub@localhost:5435/lifehub` and confirm everything works before touching a real production database.

1. Provision a Postgres database (Vercel Postgres, Neon, Supabase, RDS, …) and set `DATABASE_URL` to its connection string.
2. Set `AUTH_SECRET` (a fresh one — don't reuse the local dev value) and `NEXTAUTH_URL` to your production URL.
3. Change `datasource.provider` in `prisma/schema.prisma` from `"sqlite"` to `"postgresql"`, then establish a **fresh** migration history against Postgres — the committed `prisma/migrations` folder was generated for SQLite and Prisma refuses to replay it against a different provider (see the trade-off note above). Delete/archive that folder and run `npx prisma migrate dev --name init` once against the (empty) production database to create a Postgres-native baseline migration; commit that new `prisma/migrations` folder in place of the old one. From then on, ordinary schema changes go through `prisma migrate dev` locally against Postgres and `prisma migrate deploy` in CI/CD as usual.
4. `npm run build && npm run start`, or deploy to Vercel (zero extra config needed for a standard Next.js App Router project).
5. Optionally run `npm run db:seed` once against a **staging** database if you want a populated demo environment — never run it against a database with real user data, since it deletes and recreates the `demo@lifehub.app` account by design.
