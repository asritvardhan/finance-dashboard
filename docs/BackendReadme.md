# Finance Dashboard — Backend

Express REST API with MongoDB (Mongoose), JWT access and refresh tokens, role-based access control, and rate limiting. It powers the Finance Dashboard web app: authentication, user administration (admin), transactions, and aggregated dashboard analytics.

## Requirements

- **Node.js** 18+ recommended  
- **MongoDB** (local instance or Atlas connection string)

## Setup

1. From this directory, install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the `backend` folder (same level as `server.js`). Use the variables listed below.

3. Ensure MongoDB is running and `MONGO_URI` is correct.

4. Start the server:

   ```bash
   npm run dev
   ```

   For production-style runs:

   ```bash
   npm start
   ```

The API listens on **port 5000** by default (`http://localhost:5000`). JSON routes are under `/api`. A liveness check is available at `GET /health`.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing access tokens |
| `JWT_EXPIRE` | Yes | Access token expiry (e.g. `15m`, `1h`) |
| `JWT_REFRESH_SECRET` | Yes | Secret for signing refresh tokens (stored server-side) |
| `PORT` | No | Server port (default `5000`) |
| `NODE_ENV` | No | `development` or `production` (affects logging and error `stack` in responses) |
| `CORS_ORIGIN` | No | Allowed browser origin (use `http://localhost:5173` when using the Vite dev server) |
| `RATE_LIMIT_WINDOW_MS` | No | API rate-limit window in ms (default 15 minutes) |
| `RATE_LIMIT_MAX` | No | Max requests per IP per window for `/api` (default `100`) |

Generate strong random values for `JWT_SECRET` and `JWT_REFRESH_SECRET`; do not commit `.env`.

## Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| Development | `npm run dev` | Run with `nodemon` (auto-restart) |
| Start | `npm start` | Run `node server.js` |
| Test | `npm test` | Jest (add or run tests as configured in the project) |

## Project layout (high level)

- `server.js` — Bootstraps DB connection and HTTP server  
- `src/app.js` — Express app: middleware, `/api` routes, error handling  
- `src/routes/` — Route definitions (`auth`, `users`, `transactions`, `dashboard`)  
- `src/controllers/` — Request handlers  
- `src/services/` — Business logic  
- `src/models/` — Mongoose models (`User`, `Transaction`, `RefreshToken`)  
- `src/middleware/` — Auth (`protect`), roles/permissions, validation, rate limits  
- `src/config/` — Roles, permissions, shared constants  

## Roles and permissions

- **viewer** — Dashboard and analytics only (no transaction CRUD via API).  
- **analyst** — View/create/update transactions; dashboard and analytics. Deletes are soft deletes.  
- **admin** — Full transaction CRUD (hard delete), user management, dashboard and analytics.  

For **viewer**, **analyst**, and **admin**, transaction and dashboard data use an **org-wide** scope (shared ledger). Any other future role would be restricted to that user’s own transactions only (see `src/utils/transactionScope.js`).

## Security notes

- Passwords are hashed with bcrypt.  
- Helmet and CORS are enabled; tune `CORS_ORIGIN` for your frontend URL.  
- Stricter rate limits apply to auth routes; transaction creation has an hourly cap.  
- Full HTTP API reference: see [`../docs/API.md`](../docs/API.md) in the repository root’s `docs` folder.

## Frontend integration

The Vite dev server proxies `/api` and `/health` to `http://localhost:5000`. Run the backend on port 5000 and set `CORS_ORIGIN` to match your frontend origin if you call the API directly from the browser.
