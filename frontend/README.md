# Finance Dashboard — Frontend

React 19 single-page application built with **Vite**. It provides login and registration, a protected dashboard with summaries and charts, and a transactions area for users with the right permissions. The UI talks to the backend through a small `fetch` wrapper that sends JSON and attaches the JWT from `localStorage`.

## Requirements

- **Node.js** 18+ recommended  
- Running **backend** API (default `http://localhost:5000`) — see [`../backend/README.md`](../backend/README.md)

## Setup

1. From this directory:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

   Vite serves the app at **http://localhost:5173** by default.

3. Ensure the backend is up so API calls succeed. In development, `vite.config.js` **proxies** `/api` and `/health` to `http://localhost:5000`, so the browser only talks to the Vite origin and avoids CORS issues for those paths.

## Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| Dev | `npm run dev` | Vite dev server with HMR |
| Build | `npm run build` | Production build to `dist/` |
| Preview | `npm run preview` | Serve the production build locally |
| Lint | `npm run lint` | ESLint |

## App structure (high level)

- `src/main.jsx` — React root  
- `src/App.jsx` — Routes: `/login`, `/register`, protected `/` (dashboard) and `/transactions`  
- `src/context/` — Auth provider and hooks (`AuthProvider`, `useAuth`)  
- `src/api/client.js` — API helper: `api(path, options)`, token storage keys `fd_token` / `fd_refresh`  
- `src/components/` — Layout, modals, charts, `ProtectedRoute`, permission-aware `TransactionRoute`  
- `src/pages/` — Dashboard, login, register, transactions  
- `src/utils/` — Formatting and permission helpers  

## Authentication

- After login/register, access and refresh tokens are stored in **localStorage**.  
- Authenticated requests send `Authorization: Bearer <access_token>`.  
- Protected routes use `ProtectedRoute`; transaction views respect backend-aligned permissions in `src/utils/permissions.js`.

## Production / custom API URL

The client uses relative URLs (`/api/...`), which assumes either:

- The same host serves the built static files and reverse-proxies `/api` to the backend, or  
- You change `src/api/client.js` (or environment-based base URL) to point at your API’s absolute origin.

If the frontend and API are on different origins, configure the backend `CORS_ORIGIN` to your deployed frontend URL.

## API reference

Endpoint details, request bodies, and roles are documented in [`../docs/API.md`](../docs/API.md).
