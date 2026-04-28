# FYPConnect Frontend

React + TypeScript frontend for FYPConnect, a final-year project teammate matching platform. The app covers registration, email verification, login, profile setup, collaborator discovery, likes/passes, matches, chat, profile editing, match preferences, restricted users, and account deletion.

The frontend is intentionally lightweight: Vite for development/builds, React components, a small custom route guard in `src/App.tsx`, and a typed fetch-based API layer.

## Tech Stack

- React 19
- TypeScript
- Vite
- ESLint
- Browser `fetch` with cookie-based authentication
- CSS modules by folder convention through shared/global styles

## Backend Dependency

This app expects the FYPConnect backend to be running separately. In local development the default API base URL is:

```text
http://localhost:5000/api/v1
```

The backend must allow credentials from the frontend origin, usually:

```text
http://localhost:5173
```

## Environment Setup

Create a local environment file if the backend URL differs from the default:

```bash
cp .env.example .env
```

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

## Installation

```bash
npm install
```

## Running Locally

```bash
npm run dev
```

Vite will print the local URL, usually:

```text
http://localhost:5173
```

## Verification Scripts

```bash
npm run lint      # Run ESLint
npm run build     # Type-check and create a production build
npm run check     # Run lint, then build
npm run preview   # Preview the production build
```

For demo readiness, run:

```bash
npm run check
npm audit --audit-level=high
```

## Folder Structure

```text
src/
  api/
    authApi.ts                 Authentication requests
    profileApi.ts              Profile setup, status, and profile update requests
    preferencesApi.ts          Match preference requests
    safetyApi.ts               Account deletion and restricted-user requests
    discoveryApi.ts            Browse/discovery requests
    browseApi.ts               Like/pass actions
    matchesApi.ts              Match list and updated-profile requests
    chatApi.ts                 Conversation and message requests
    dashboardSafetyApi.ts      Dashboard unmatch/block actions
    client.ts                  Shared response handling
    routes.ts                  API base URL and endpoint constants

  components/
    dashboard/                 Dashboard-only UI components
    authcard.tsx               Shared auth shell
    errorbanner.tsx            Shared error message component
    inputfield.tsx             Shared auth input component

  pages/
    auth/                      Login, registration, and email verification
    dashboard/                 Browse, match, and chat dashboard
    profile-setup/             Multi-step profile setup flow
    profile/                   Profile overview, edit profile, and match settings

  styles/                      Global styling
  types/                       Shared view-model types
  utils/                       Frontend data mapping and validation helpers
```

## Main User Flow

1. User registers with a Habib student email.
2. User verifies the emailed code.
3. User logs in.
4. App checks whether profile setup is complete.
5. Incomplete profiles are routed through setup.
6. Complete profiles can browse collaborators, like/pass profiles, manage matches, chat, edit their profile, update match preferences, and manage restricted users.

## Validation and Feedback

The frontend performs client-side validation before sending user input to the backend:

- Habib student email format checks
- Required auth fields
- Verification code length and digit checks
- Required profile setup fields
- Word limits for bio and FYP idea
- Image type and size checks
- HTTP/HTTPS-only profile/project links
- Match preference selection checks
- Chat empty-message and max-length checks

Backend errors are surfaced through direct user-facing messages where the API returns them, with clear fallback messages when it does not.

## Notes for Reviewers

- `src/App.tsx` shows the page routing and profile-completion guards.
- `src/api/routes.ts` is the single place to inspect backend endpoint paths.
- API files are split by product area so request ownership is easy to follow.
- The frontend uses cookies for auth, so browser requests include credentials.
