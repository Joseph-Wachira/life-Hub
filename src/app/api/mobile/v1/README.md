# Mobile API (`/api/mobile/v1`)

Internal contract notes for this route tree — see the root `README.md`'s "Mobile app" section for the user-facing setup docs.

## Auth

Every route except `auth/login` and `auth/refresh` requires:

```
Authorization: Bearer <accessToken>
```

Access tokens are short-lived (15 min, `src/lib/mobile/jwt.ts`) and signed with `MOBILE_JWT_SECRET` — a different secret than Auth.js's `AUTH_SECRET`, so the mobile app and the web session cookie can never be confused for one another. When an access token expires, call `auth/refresh` with the refresh token to get a new pair; refresh tokens rotate on every use (`src/lib/mobile/refresh-tokens.ts`) and are stored server-side only as a SHA-256 hash (`MobileSession` table), so they can be revoked (sign-out, reuse detection) the same way a password hash can't be reversed but can be checked.

## Response envelope

Success: `{ "data": <payload> }`. Failure: `{ "error": { "code": string, "message": string, "fieldErrors"?: Record<string, string[]> } }` with a matching HTTP status (400 validation, 401 unauthenticated, 403 wrong/missing workspace, 404 not found, 500 unexpected). Build both with the helpers in `src/lib/mobile/http.ts` — never `NextResponse.json` directly in a route — so this stays uniform.

## Workspace scoping

There's no cookie here (unlike the web app's `requireWorkspace()` in `src/lib/session.ts`), so every request that reads/writes workspace-owned data must pass `workspaceId` explicitly (query param on GET, JSON body field otherwise) and every route must call `requireMobileWorkspace(userId, workspaceId)` (`src/lib/mobile/auth.ts`) before touching data. Several underlying `lib/services/*` mutators (`tasks.ts` update/move/setStatus/delete, `projects.ts` update/delete, most of `finance.ts`'s update/delete helpers) take only a record `id` with **no** workspace filter — the route itself must first re-fetch the record with a workspace-scoped `getX`/`listX` call and 404 if it doesn't belong to the caller's workspace, *before* calling the unscoped mutator. Don't add a new mutation route without that pre-check.

## Adding an endpoint

1. Reuse the existing `lib/services/*` function if one exists; only add a new service function for logic that's genuinely new (e.g. `today/route.ts`'s dashboard aggregation).
2. Reuse `lib/validations/*` schemas where the shape already matches JSON (enums, most of `settings.ts`); write a new schema in `packages/shared/src/schemas.ts` when the web schema is FormData-shaped (dates as strings, `""` meaning unset) — mobile sends real JSON, so those don't line up.
3. Add/extend a DTO mapper in `src/lib/mobile/dto.ts` rather than shaping JSON inline in the route.
4. Wrap the handler in `withMobileErrors` and return `mobileJson(...)`.
