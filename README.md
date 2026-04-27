# FYPConnect Frontend

This folder contains the React + TypeScript frontend for FYPConnect, a student project-matching platform. It handles registration, email verification, login, profile setup, browsing possible collaborators, matches, chat, and profile management.

The app is intentionally lightweight: it uses Vite for development/building, plain React components, and a small custom client-side router in `src/App.tsx` instead of a full routing library.

## Related Repository

This frontend works with the FYPConnect backend:

[View the backend repository](https://github.com/AbdullahAhmed6859/fypconnect-backend)

## Tech Stack

- React 19 with TypeScript
- Vite for local development and builds
- ESLint for code checks
- Browser `fetch` for API calls
- CSS files for styling and layout

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend expects the backend API to be running at:

```text
http://localhost:5000/api/v1
```

That base URL is currently defined in `src/api/routes.ts`.

## Useful Scripts

```bash
npm run dev      # Start Vite locally
npm run build    # Type-check and create a production build
npm run lint     # Run ESLint
npm run preview  # Preview the production build locally
```

## Folder Guide

```text
src/
  api/          API route constants and request helpers
  assets/       Static image/SVG assets used by the app
  components/   Reusable UI components
  data/         Local/static dashboard data
  pages/        Full-page views such as login, register, dashboard, and profile setup
  styles/       Shared global styling
  types/        Shared TypeScript types
  utils/        Small frontend utility helpers
```

## Main User Flow

1. A new user registers from the default page.
2. They verify their email through `/verify-email`.
3. After login, the app checks whether their profile is complete.
4. Incomplete profiles are sent through the profile setup pages.
5. Completed profiles can access the dashboard, browse students, like/pass profiles, manage matches, chat, and update their own profile.

## Notes for Studying the Code

- `src/App.tsx` is the best starting point because it shows all page-level routes and access guards.
- `src/api/routes.ts` maps frontend actions to backend endpoints.
- `src/api/auth.ts` covers authentication, profile setup, profile editing, preferences, blocked users, and account deletion requests.
- `src/api/dashboard.ts` covers discovery, matching, chat, liking, passing, blocking, and unmatching.
- Most visible screens live in `src/pages`, while dashboard-specific pieces are split under `src/components/dashboard`.

## Backend Dependency

This frontend is designed to work with the sibling `fypconnect-backend` folder. Because the app uses cookie-based authentication, the backend must allow credentials from the frontend origin. In development, the backend is configured for `http://localhost:5173`.
