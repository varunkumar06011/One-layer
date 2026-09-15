# ONE LAYER — Security Architecture

Baseline standard: **OWASP ASVS 4.0 Level 2** (Level 3 for the admin portal and payment flow).
This document is the source of truth for how ONE LAYER handles identity, authorization, money,
data and operations. Code that contradicts it is a bug.

Guiding principle: **the frontend is not a security boundary.** Anything the browser sends
(role, price, discount, order ownership, payment status) is an untrusted claim until the
backend independently proves it.

---

## 1. System architecture

```
                         CUSTOMER (browser / mobile)
                                    │  HTTPS only (HSTS, TLS 1.2+)
                                    ▼
                            CDN + WAF (Cloudflare)
                                    │
                                    ▼
                          Backend API (Express, stateless)
                                    │
        ┌───────────────┬───────────┴────────────┬────────────────┐
        ▼               ▼                        ▼                ▼
   Auth (Supabase)   Orders / Cart          Products/Pricing   Uploads (design art)
        │               │                        │                │
        └───────────────┴───────────┬────────────┴────────────────┘
                                    ▼
                         PostgreSQL (Supabase, private)
                                    ▲
   Payment gateway (Razorpay) ──────┘  webhook + server-side verification
                                          → order marked PAID

                          ADMIN PORTAL (separate origin/path)
                                    │  admin credentials + MFA
                                    ▼
                          Admin API — RBAC + audit log
```

Environments are fully separated: **development / staging / production**, each with its own
database, secrets, gateway keys and Supabase project. No production data in staging.

### Current stack (as implemented in this repo)

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React 18 + Vite, deployed to Vercel | Public code — contains no secrets |
| Customer auth | Supabase Auth (Google OAuth + email) | Backend verifies the Supabase JWT itself |
| Backend API | Node 20+, Express 4, ESM | Stateless; horizontally scalable |
| Data | Supabase Postgres, RLS enabled | Backend uses a least-privilege role |
| Payments | *not yet integrated* — target: Razorpay | See §6 |
| Admin | `/admin` route in the SPA + `/api/admin/*` | Own auth, own token audience, MFA planned |

---

## 2. Authentication

### 2.1 Customers

Supabase Auth owns customer credentials — we never store customer passwords. The backend:

1. Reads the `Authorization: Bearer <supabase access token>` header.
2. Verifies the JWT signature and claims (`iss`, `aud`, `exp`) against the project's JWKS /
   JWT secret — *never* by decoding without verification, and never by trusting a `user_id`
   sent in the body.
3. Loads the user row and attaches `req.user = { id, email, role }`.

Supabase settings required in production:

- Email/phone confirmation **on**; OTP expiry ≤ 10 min, single use, rate-limited per identifier
  and per IP.
- Access token lifetime 15–60 min, refresh-token **rotation** with reuse detection enabled.
- Password policy: minimum 12 chars, HIBP breach check enabled. Supabase hashes with bcrypt;
  any credential we ever hash ourselves uses **Argon2id** (`m=19 MiB, t=2, p=1` minimum).
- Password-reset and magic links: single-use, ≤ 30 min expiry, invalidated on use.
- "Log out of all devices" = revoke all refresh tokens for the user.

Brute-force controls (enforced at our edge as well, because Supabase limits are per-project):

| Endpoint class | Limit |
|---|---|
| Login / OTP request | 5 per 15 min per IP **and** per identifier |
| Password reset | 3 per hour per identifier |
| Write endpoints (orders, quotes, reviews) | 20 per 15 min per IP |
| General API | 300 per 15 min per IP |

After 10 consecutive failures on an identifier: progressive lockout (exponential backoff,
cap 30 min) plus an alert.

### 2.2 Admins

Admins are **not** customers with a flag. They live in a separate `admin_users` table with a
separate token audience (`aud: "one-layer-admin"`), so a customer token can never be replayed
against an admin route and vice-versa.

- Password hashed with **Argon2id**. No shared/default password may ever ship — the server
  refuses to start in production without `ADMIN_PASSWORD_HASH` set.
- Access token: JWT, **15 minutes**, signed with `ADMIN_JWT_SECRET` (≥ 32 bytes, rotated
  quarterly).
- Refresh token: opaque, 8 hours, **rotated on every use**, stored hashed, delivered as
  `HttpOnly; Secure; SameSite=Strict; Path=/api/admin` cookie. Reuse of a consumed refresh
  token revokes the whole family and raises an alert.
- Idle session timeout 30 min, absolute 8 h.
- MFA (TOTP) required — rollout item, see §13.
- Re-authentication required for: refunds, price/discount changes, role changes, data export.
- Every admin login (success and failure) is written to the audit log and alerted on.

---

## 3. Authorization

Every request answers these questions, in order, server-side:

```
WHO?  → verified token subject          (401 if absent/invalid)
AUTHENTICATED? → signature + expiry     (401)
WHAT ROLE? → role from DB, not token    (403)
OWNS THE RESOURCE? → row-level check    (404, not 403 — don't leak existence)
→ only then perform the action
```

Rules:

- **No endpoint is public by default.** Routes opt in to `public` explicitly; everything else
  requires `requireCustomer` or `requireAdmin`.
- **IDOR**: `GET /api/orders/:id` must filter by owner — `where id = :id and user_id = :me`.
  Never "fetch then compare after returning". Not-owned and not-found both return **404**.
- Roles are read from the database on each request (cheap, cached ≤ 60 s), so a revoked admin
  loses access immediately instead of when their token expires.
- Defense in depth: Postgres **RLS** enforces the same ownership rules, so a bug in the API
  layer still cannot read another customer's rows.

### Role model

| Role | Can |
|---|---|
| `CUSTOMER` | own profile, addresses, orders, wishlist, reviews |
| `SUPPORT` | read orders, read customers, add internal notes |
| `CONTENT_MANAGER` | products, images, copy |
| `ORDER_MANAGER` | order status, shipping, refunds (with re-auth) |
| `ADMIN` | everything above + coupons + pricing rules |
| `SUPER_ADMIN` | admin user management, role changes, secret rotation |

Least privilege: nobody gets `SUPER_ADMIN` "to make it work".

---

## 4. Input validation and output safety

- Every request body, query and param is parsed with a **Zod schema**; unknown keys are
  stripped, types coerced explicitly, strings length-bounded. Validation failure → `400` with
  field-level messages only (never the raw exception).
- Request body limit: **256 KB** JSON (uploads go to object storage, not through the JSON body).
- Pagination is mandatory on list endpoints: `limit` default 20, max 100.
- SQL is only issued through parameterized queries / the Supabase client. No string-built SQL.
- XSS: React escapes by default; `dangerouslySetInnerHTML` is banned. Any rich text is
  sanitized server-side before storage and on render.
- CSRF: the API is token-based (`Authorization` header), so cross-site form posts can't
  authenticate. The admin refresh cookie is `SameSite=Strict` and only used on
  `/api/admin/refresh`.
- SSRF: the only outbound call from user input is the India Post pincode lookup — the pincode
  is validated as `^[1-9][0-9]{5}$` before being interpolated into a fixed host URL. No
  user-supplied URLs are fetched, ever.
- Path traversal / command injection: no user input reaches the filesystem or a shell.
- Security headers via Helmet: HSTS, `X-Content-Type-Options`, `Referrer-Policy`,
  `X-Frame-Options: DENY`, and a CSP on the frontend (`default-src 'self'`, no `unsafe-eval`).
- CORS: strict allowlist of known origins, `credentials: true`. Wildcard origin is rejected at
  startup in production.

---

## 5. Pricing integrity (e-commerce specific)

The browser sends **intent only**: product id, size, colour, quantity, coupon code, address.
It never sends money. The server recomputes:

```
product     ← database
unit price  ← database price table (by size, + custom-print surcharge)
discount    ← server coupon rules (validity, per-user usage, min cart value)
stock       ← database, decremented in the same transaction as order creation
shipping    ← server zone rules from the verified pincode
tax         ← server tax rules
TOTAL       ← server arithmetic
```

Any `price`, `total`, `discount`, `shipping` or `status` field present in the request body is
**ignored and logged** as a tampering signal. If the client's displayed total differs from the
server total, the order is rejected with `409 PRICE_CHANGED` and the client re-fetches.

Stock is decremented with `UPDATE ... SET stock = stock - :qty WHERE id = :id AND stock >= :qty`
inside the order transaction, so concurrent checkouts can't oversell.

---

## 6. Payments

We do not see, transmit or store card data. Card entry happens in the gateway's hosted
checkout/SDK (Razorpay), keeping us out of PCI-DSS scope beyond SAQ-A.

Stored per payment: `payment_id`, `order_id`, `amount_minor`, `currency`, `status`,
`gateway_reference`, `method_summary` (e.g. "UPI"), timestamps. **Never** PAN, CVV, expiry or
UPI PIN.

Flow:

```
1. Client: POST /api/orders          → server computes total, creates order (PENDING)
2. Server: create gateway order for exactly that amount → returns gateway order id
3. Client: completes payment in the gateway UI
4. Gateway → POST /api/payments/webhook (signature-verified, raw body)
5. Server: verify signature, verify amount + currency + order id match OUR order,
           idempotency key = gateway event id
6. Only then: order.status = PAID  → fulfilment
```

The client's "payment succeeded" callback is a **UI hint only** — order state changes on the
verified webhook (or a server-side gateway fetch), never on a client claim. Refunds go through
the gateway API, require re-auth, and are audit-logged.

---

## 7. Database security

- Supabase Postgres, no public IP exposure; access via the Supabase API/pooler over TLS.
- The API connects as a least-privilege role: `SELECT/INSERT/UPDATE` on the tables it needs,
  no `DROP`, no `SUPERUSER`. The `service_role` key is used only by server code for narrowly
  scoped operations and is **never** shipped to the browser.
- **RLS enabled on every table** with `auth.uid()`-scoped policies (see `supabase_schema.sql`
  and `supabase_security.sql`).
- Encryption in transit everywhere; encryption at rest provided by Supabase. Application-level
  encryption for anything extra-sensitive we may add later.
- Backups: Supabase PITR enabled + the existing GitHub Actions dump-to-Drive job.
  **Restore is tested quarterly into a scratch project** — an untested backup is not a backup.
- Separate projects for dev / staging / prod. Production data is never copied into staging
  without anonymisation.

---

## 8. Secrets

| Secret | Lives in | Never in |
|---|---|---|
| `ADMIN_PASSWORD_HASH`, `ADMIN_JWT_SECRET` | host env / secret manager | git, frontend |
| `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET` | host env | git, frontend |
| `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | host env | git, frontend |
| SMTP / WhatsApp API credentials | host env | git, frontend |

Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` may reach the browser — the anon key is
public by design and is safe **only because RLS is enforced**. Everything shipped to the
browser is assumed public. Secret scanning runs in CI; a leaked secret is rotated, not deleted
from history and forgotten.

---

## 9. File and image uploads

Custom design artwork is the main upload surface.

- Upload direct to object storage (Supabase Storage) via short-lived signed URLs — bytes do
  not pass through the API.
- Allowlist `image/png`, `image/jpeg`, `image/webp`, `application/pdf` by **content sniffing**,
  not by extension or client-supplied MIME type.
- Max 10 MB per file, max 5 files per order line.
- Randomised object keys (UUID); the original filename is stored as metadata only.
- Images are re-encoded server-side (sharp) — this strips EXIF and neutralises polyglot files.
- Storage bucket is private; downloads use signed, time-limited, access-controlled URLs.
- Nothing uploaded is ever served from an origin that can execute it.

---

## 10. Error handling, logging and monitoring

- Clients get a generic message plus a correlation id: `{ "error": "Something went wrong",
  "requestId": "..." }`. Stack traces, SQL and driver errors never leave the server.
- Structured JSON logs with the request id, actor id, route, status and duration.
- **Audit log** (append-only table) for: login success/failure, password reset, OTP request,
  admin login, role/permission change, order create, order status change, payment status
  change, refund, address change, account deletion, price/coupon change, tampering signals.
- Never logged: passwords, OTPs, tokens, cookies, card data, full addresses in plaintext debug
  output.
- Alerts on: admin login from a new IP, >N failed logins, payment/amount mismatch, webhook
  signature failure, 5xx rate spike, tampering signals.

---

## 11. Infrastructure and delivery

- HTTPS everywhere with HSTS; HTTP redirects to HTTPS.
- CDN + WAF in front of the API (bot/abuse rules, IP reputation, request size caps).
- Only the load balancer is internet-facing; the database is private.
- Dependencies patched continuously — Dependabot + `npm audit` gate in CI.
- CI gates: secret scanning, dependency scan, SAST, lint. Build fails on high severity.
- No debug endpoints, no directory listing, no unnecessary ports.

---

## 12. Gap analysis — where this repo stands

| Area | Before | Status after this change |
|---|---|---|
| Admin password | Plaintext compare, default `onelayer-admin` | Argon2id hash, env-required, no default in prod |
| Admin tokens | Random string in an in-memory `Set`, never expires | Short-lived JWT + rotating refresh cookie |
| Admin token storage (client) | `localStorage` | Kept for access token, refresh in HttpOnly cookie |
| Login throttling | None | Per-IP + per-account throttling with lockout |
| Rate limiting | None | Tiered limits on auth / write / general routes |
| Input validation | Ad-hoc `if` checks | Zod schemas on every route |
| Security headers | None | Helmet + HSTS + CSP |
| CORS | Defaults to `*` with `credentials: true` | Strict allowlist, wildcard rejected in prod |
| Body limit | 10 MB JSON | 256 KB JSON |
| Customer order access | Orders readable by admin token only, stored in memory | Verified Supabase identity + ownership checks |
| Order durability | In-memory array (lost on restart) | Postgres tables + RLS (`supabase_security.sql`) |
| Pricing | Mostly server-side already | Client-sent money fields explicitly rejected |
| Payments | Not integrated | Flow specified in §6, webhook-verified |
| Errors | Stack traces to console, generic 500 | Correlation ids, no internals leaked |
| Audit log | None | Append-only audit table + helper |
| MFA for admin | None | Specified; rollout item |

---

## 13. Pre-launch checklist

**Automated (CI)**

- [ ] Dependency scan (`npm audit` / Dependabot) — no high/critical
- [ ] Secret scanning on every push and on history
- [ ] SAST (CodeQL or Semgrep)
- [ ] API security tests: authz matrix, rate limits, validation fuzzing

**Manual**

- [ ] Auth: login, OTP, reset, session expiry, logout-all
- [ ] Authorization/IDOR: user A cannot read/modify user B's orders, addresses, reviews
- [ ] Price manipulation: tampered price/discount/shipping/total are ignored
- [ ] Payment: amount mismatch, replayed webhook, forged signature all rejected
- [ ] Admin: role escalation attempts, re-auth on sensitive actions, audit entries present
- [ ] Uploads: wrong type, oversized, polyglot, EXIF stripping
- [ ] Rate limits and lockout behave as specified
- [ ] Backup restore rehearsal completed

**Before taking real payments at volume:** third-party penetration test against the ASVS L2
requirements above.

---

## 14. Rollout order

1. **Done in this change** — backend security layer: config validation, Argon2id admin auth,
   JWT + refresh rotation, RBAC, Zod validation, rate limiting, Helmet, strict CORS, generic
   error handling with correlation ids, audit logging, DB schema with RLS.
2. Move orders/quotes/sample-kit from in-memory arrays to Postgres and enable the RLS policies
   in `supabase_security.sql`.
3. Razorpay integration with webhook verification (§6).
4. Admin MFA (TOTP) + admin user management under `SUPER_ADMIN`.
5. Signed-URL upload pipeline with re-encoding (§9).
6. CI security gates, WAF/CDN in front of the API, backup-restore rehearsal.
7. Penetration test.
