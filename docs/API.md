# Finance Dashboard — HTTP API Reference

**Base URL (local):** `http://localhost:5000`  
**API prefix:** `/api`  
**Health check (no `/api` prefix):** `GET /health`

Unless noted, request and response bodies are **JSON**. Successful responses typically include `success: true`; errors include `success: false` and a `message` string.

---

## Authentication

Protected routes expect a header:

```http
Authorization: Bearer <access_token>
```

Inactive users receive `401` with an explanatory message.

---

## Conventions

### Pagination (where applicable)

Query parameters: `page` (default `1`), `limit` (default `10`, max `100` for some list endpoints).

Response shape often includes:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "pages": 0
  }
}
```

### Roles

| Role | Description |
|------|-------------|
| `viewer` | Dashboard/analytics only; no transaction list/CRUD |
| `analyst` | View/create/update transactions; soft delete; dashboard |
| `admin` | Full user management; transaction hard delete; all analyst capabilities |

### Transaction scope

For roles `viewer`, `analyst`, and `admin`, transaction and dashboard queries use a **shared org-wide** dataset (all non–soft-deleted transactions). See backend `orgWideTransactionMatch` for details.

### Rate limiting

- All `/api/*` routes: general limit (configurable via `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`).  
- `/api/auth/register`, `/api/auth/login`: stricter limit (5 failed attempts per 15 minutes per IP; successful logins are not counted).  
- `POST /api/transactions`: 50 creates per IP per hour.

---

## Health

### `GET /health`

**Auth:** None  

**200 OK**

```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-04-05T12:00:00.000Z",
  "environment": "development"
}
```

---

## Auth — `/api/auth`

### `POST /api/auth/register`

**Auth:** Public  

**Body**

| Field | Type | Rules |
|-------|------|--------|
| `name` | string | Required, 2–50 characters |
| `email` | string | Required, valid email |
| `password` | string | Required, min 6 characters |

**201 Created** — Returns user (without password), `token`, `refreshToken`.  
**409 Conflict** — Email already registered.

---

### `POST /api/auth/login`

**Auth:** Public  

**Body**

| Field | Type | Rules |
|-------|------|--------|
| `email` | string | Required |
| `password` | string | Required |

**200 OK** — Same payload shape as register (`data.user`, `data.token`, `data.refreshToken`).  
**401 Unauthorized** — Invalid credentials or inactive account.

---

### `POST /api/auth/logout`

**Auth:** Bearer  

**Body (optional)**

| Field | Type | Description |
|-------|------|-------------|
| `refreshToken` | string | If sent, that refresh token is revoked |

**200 OK** — `{ "success": true, "message": "Logged out successfully" }`

---

### `GET /api/auth/me`

**Auth:** Bearer  

**200 OK** — `{ "success": true, "data": { ...user document without password } }`

---

### `POST /api/auth/refresh-token`

**Auth:** Public (uses refresh token in body)  

**Body**

| Field | Type | Rules |
|-------|------|--------|
| `refreshToken` | string | Required, must be valid and not revoked |

**200 OK**

```json
{
  "success": true,
  "data": {
    "token": "<new access token>",
    "refreshToken": "<new refresh token>"
  }
}
```

**401 Unauthorized** — Invalid or expired refresh token. Old refresh token is revoked on success.

---

## Users — `/api/users`

**Auth:** Bearer **and** role `admin` on every route below.

### `GET /api/users`

**Query (optional):** `page`, `limit`, `role`, `status`

**200 OK** — Paginated list of users (no passwords).

---

### `GET /api/users/:id`

**Params:** `id` — MongoDB ObjectId  

**200 OK** — Single user.  
**404** — Not found.

---

### `POST /api/users`

**Body**

| Field | Type | Rules |
|-------|------|--------|
| `name` | string | Required for create (validate with backend) |
| `email` | string | Required, unique |
| `password` | string | Required |
| `role` | string | Optional: `viewer` \| `analyst` \| `admin` (default `viewer`) |
| `status` | string | Optional: `active` \| `inactive` (default `active`) |

**201 Created** — Summary user object.  
**409** — Duplicate email.

---

### `PUT /api/users/:id`

**Body (all optional in validation; send fields to update):** `name`, `email`, `role`, `status` — password updates may be omitted depending on your client (backend validates optional fields).

**200 OK** — Updated summary.

---

### `DELETE /api/users/:id`

**200 OK** — User deleted.  
**400** — Cannot delete own account.  
**404** — Not found.

---

### `PATCH /api/users/:id/role`

**Body:** `{ "role": "viewer" | "analyst" | "admin" }`

**200 OK** — Updated user role summary.

---

### `PATCH /api/users/:id/status`

**Body:** `{ "status": "active" | "inactive" }`

**200 OK** — Updated status summary.

---

## Transactions — `/api/transactions`

**Auth:** Bearer on all routes. Permissions: **view** (`viewer` cannot use these routes), **create/update/delete** per role matrix in backend `roles.js`.

### Allowed `type` values

- `income`
- `expense`

### Allowed `category` values

**Income:** `Salary`, `Freelance`, `Investment`, `Business`, `Gift`, `Other Income`  

**Expense:** `Food & Dining`, `Transportation`, `Shopping`, `Entertainment`, `Bills & Utilities`, `Healthcare`, `Education`, `Rent`, `Insurance`, `Other Expense`

---

### `GET /api/transactions`

**Permission:** `view_transactions` (analyst, admin)

**Query (optional)**

| Parameter | Description |
|-----------|-------------|
| `page`, `limit` | Pagination |
| `type` | `income` \| `expense` |
| `category` | One of allowed categories |
| `startDate`, `endDate` | ISO 8601, filter `date` |
| `minAmount`, `maxAmount` | Numeric range on `amount` |
| `search` | Case-insensitive match in `notes` or `category` |

**200 OK** — `{ success, data: Transaction[], pagination, filters }`

---

### `GET /api/transactions/stats/summary`

**Permission:** `view_transactions`

**Query (optional):** `startDate`, `endDate` (ISO 8601)

**200 OK** — Aggregates:

```json
{
  "success": true,
  "data": {
    "income": { "total": 0, "count": 0, "average": 0 },
    "expense": { "total": 0, "count": 0, "average": 0 },
    "netBalance": 0,
    "totalTransactions": 0
  }
}
```

---

### `GET /api/transactions/:id`

**Permission:** `view_transactions`

**200 OK** — Single transaction.  
**404** — Not found or not in scope.

---

### `POST /api/transactions`

**Permission:** `create_transaction` (analyst, admin). Rate limited.

**Body**

| Field | Type | Rules |
|-------|------|--------|
| `amount` | number | Required, &gt; 0 |
| `type` | string | `income` \| `expense` |
| `category` | string | Must match type’s category list |
| `date` | string (ISO) | Optional; default now |
| `notes` | string | Optional, max 500 chars |
| `tags` | string[] | Optional |

**201 Created** — Full transaction document (includes `user`, timestamps).

---

### `PUT /api/transactions/:id`

**Permission:** `update_transaction`

**Body:** Same fields as create; send fields to update (validation runs on provided fields per route rules).

**200 OK** — Updated transaction.

---

### `DELETE /api/transactions/:id`

**Permission:** `delete_transaction` — **admin** only (analyst role does not include this permission, so this route is not available to analysts).

**200 OK** — Transaction permanently removed (`hard delete`).

> The backend controller also contains a soft-delete path for non-admin callers; with the current permission matrix only admins can call this endpoint, so responses use the permanent-delete message.

---

## Dashboard — `/api/dashboard`

**Auth:** Bearer. **Permission:** `view_dashboard` (all three roles).

### `GET /api/dashboard/summary`

**Query (optional)**

| Parameter | Description |
|-----------|-------------|
| `startDate`, `endDate` | ISO 8601; if both set, used as range |
| `period` | If no custom range: `week` \| `month` \| `year` (default `month`) |

**200 OK**

```json
{
  "success": true,
  "data": {
    "totalIncome": 0,
    "incomeCount": 0,
    "totalExpense": 0,
    "expenseCount": 0,
    "netBalance": 0,
    "period": "month"
  }
}
```

---

### `GET /api/dashboard/category`

**Query (optional):** `startDate`, `endDate`, `type` (`income` \| `expense` \| `both`, default `both`)

**200 OK** — Array of `{ category, type, total, count, average }`.

---

### `GET /api/dashboard/trends`

**Query (optional)**

| Parameter | Description |
|-----------|-------------|
| `period` | `weekly` \| `monthly` (default `monthly`) |
| `months` | Number of buckets to return (1–12, default 6) |

**200 OK** — Array of `{ period, income, expense, net, transactions }`.

---

### `GET /api/dashboard/recent`

**Query (optional):** `limit` (default `10`)

**200 OK** — Recent transactions for the org-wide scope.

---

### `GET /api/dashboard/overview`

**Query (optional):** `period` — `week` \| `month` \| `year` (default `month`)

**200 OK** — Combined payload: `summary`, `comparison` (percent changes vs previous period), `topCategories`, `recentTransactions`, `period`.

---

## Error responses

Typical error shape:

```json
{
  "success": false,
  "message": "Human-readable message",
  "stack": "..." 
}
```

`stack` is included only in development (`NODE_ENV=development`).

Common status codes: **400** validation, **401** auth, **403** forbidden (insufficient role/permission), **404** not found, **409** conflict, **429** rate limit, **500** server error.

Validation errors from `express-validator` return **400** with a combined message string.

---

## Quick reference table

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| GET | `/health` | No | Liveness |
| POST | `/api/auth/register` | No | |
| POST | `/api/auth/login` | No | |
| POST | `/api/auth/logout` | Yes | |
| GET | `/api/auth/me` | Yes | |
| POST | `/api/auth/refresh-token` | No | Body: refresh token |
| GET | `/api/users` | Admin | |
| GET | `/api/users/:id` | Admin | |
| POST | `/api/users` | Admin | |
| PUT | `/api/users/:id` | Admin | |
| DELETE | `/api/users/:id` | Admin | |
| PATCH | `/api/users/:id/role` | Admin | |
| PATCH | `/api/users/:id/status` | Admin | |
| GET | `/api/transactions` | Analyst+ | |
| GET | `/api/transactions/stats/summary` | Analyst+ | |
| GET | `/api/transactions/:id` | Analyst+ | |
| POST | `/api/transactions` | Analyst+ | Rate limited |
| PUT | `/api/transactions/:id` | Analyst+ | |
| DELETE | `/api/transactions/:id` | Admin | Permanent delete |
| GET | `/api/dashboard/summary` | Yes | `view_dashboard` |
| GET | `/api/dashboard/category` | Yes | |
| GET | `/api/dashboard/trends` | Yes | |
| GET | `/api/dashboard/recent` | Yes | |
| GET | `/api/dashboard/overview` | Yes | |

For setup and environment variables, see [`../backend/README.md`](../backend/README.md).
