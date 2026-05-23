# Moveat Client Agent Guide

## Project Context

This repository is the Moveat web client. It is a Vite + React app, not a Next.js app.

Primary stack:

- React 19
- Vite
- TypeScript
- Tailwind CSS
- Framer Motion
- Zustand with persisted local state
- `platform` API at `https://api.mov-eat.app`

Do not introduce Next.js conventions, App Router patterns, server components, or Next-specific lint/config unless the project is intentionally migrated.

## How To Use Local Skills

Local skills live under `.agents/skills`.

Use them as follows:

- `react-best-practices`: Use when writing, reviewing, or refactoring React components, data fetching, performance-sensitive UI, or bundle-heavy flows.
- `composition-patterns`: Use when a component starts growing too many booleans, modes, or deeply nested conditionals. Prefer extracted components and explicit variants over prop soup.
- `web-design-guidelines`: Use for UI/UX/accessibility reviews. This is especially relevant for onboarding, forms, navigation, and mobile ergonomics.
- `react-view-transitions`: Use only when explicitly implementing native React View Transitions. This app currently uses stable React and Framer Motion, so do not replace existing animation patterns unless the migration is intentional.
- `vercel-optimize`: Use when optimizing production deployment, Vite build output, caching, or Vercel-specific behavior.

Before using a skill, read its `SKILL.md` and apply only the relevant parts. Do not bulk-apply framework-specific advice if it does not match this Vite app.

## Frontend Architecture Rules

- Keep API contract mapping outside JSX when practical. Prefer small helper functions like `buildSignupPayload` or `buildOnboardingPayload`.
- Keep UI state local when it only affects one screen. Use Zustand only for state shared across routes or persisted product state.
- Avoid storing backend session tokens in localStorage. Browser auth uses HttpOnly cookies from `platform`.
- Every authenticated `fetch` to `platform` must include `credentials: "include"`.
- Use `VITE_API_BASE_URL` for configurable API base URL, falling back to `https://api.mov-eat.app`.
- Do not hardcode `/api` in platform calls. Public API paths are `/v1/...`.
- Keep `/v1/me` usage limited to identity/session. Fetch profile, onboarding, channels, and coaching data through specific endpoints when those screens exist.

## Platform API Contracts

Current auth/onboarding contracts:

- `POST /v1/auth/signup`
  Body: `{ email, password, firstName, lastName }`
- `POST /v1/auth/login`
  Body: `{ email, password }`
- `PUT /v1/me/onboarding`
  Requires an authenticated cookie session.
  Body must be fitness-only: `unitSystem`, `profile`, `goals`, `nutrition`.

Signup must not send `username`, `displayName`, `phoneNumber`, WhatsApp, Telegram, or channel data. Channels are linked after onboarding through `/v1/me/channels/{channel}`.

## Onboarding Rules

- Keep the first welcome screen before auth. The user should be able to tap the initial CTA before seeing login/signup.
- Require login/signup before submitting onboarding to `platform`.
- Do not mark onboarding as completed locally until `PUT /v1/me/onboarding` succeeds.
- Preserve the current visual style: rounded cards, bold typography, haptics, Framer Motion transitions, and the existing step-by-step flow.
- Do not introduce low-value redesigns while fixing API contracts.
- Keep the form mobile-first. Inputs that sit side by side on desktop should stack on small screens.
- Avoid asking for phone number during signup. Communication channels are a separate post-onboarding concern.

## React And UI Practices

- Prefer extracted helper functions over large inline transformations in JSX.
- Prefer simple derived values during render over extra `useEffect` state synchronization.
- Do not add `useMemo` or `useCallback` by default. Add them only for measured or obvious performance reasons, or when needed for stable references.
- Use functional state updates when the next state depends on the previous state.
- Keep animations purposeful: step transitions, submit feedback, and continuity. Avoid adding generic motion that does not communicate state.
- Keep accessibility in mind: buttons need clear disabled states, inputs need meaningful placeholders/labels, errors must be visible near the relevant action.
- Avoid generating or committing `dist` artifacts unless the deployment flow explicitly requires it.

## Verification

Preferred checks:

```bash
corepack pnpm install
corepack pnpm exec vite build --outDir /tmp/moveat-client-build --emptyOutDir
```

Known current caveats:

- `pnpm lint` is blocked until `eslint.config.mjs` is aligned with Vite/React instead of Next-specific config.
- `tsc --noEmit` currently reports an existing Framer Motion typing issue in `src/App.tsx`.

When reporting verification, distinguish failures caused by the current change from pre-existing repo configuration issues.
