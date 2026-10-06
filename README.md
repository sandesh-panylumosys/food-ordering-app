# Ember & Oak — Premium Café Ordering Platform

A production-oriented food ordering system for a premium café: a branded **Expo** mobile app for customers, a **Node.js/Express** REST API, a **React** admin panel, **Supabase PostgreSQL**, **Cloudinary** image hosting and **Razorpay** payments with server-side verification.

```
Expo Mobile App ──┐                       ┌── Supabase PostgreSQL (orders, catalog, users)
                  ├── REST ──► Express API ┼── Cloudinary (food & category images)
Admin Panel ──────┘                       └── Razorpay (orders, signature verification, webhooks)
```

**Customer journey:** Splash → Home → Categories → Product → Customize → Cart → Address → Summary → Razorpay → Backend verification → Confirmation → Live tracking → History.

---

## Contents

- [Tech stack](#tech-stack)
- [Monorepo structure](#monorepo-structure)
- [Installation](#installation)
- [Environment variables](#environment-variables)
- [Supabase setup](#supabase-setup)
- [Cloudinary setup](#cloudinary-setup)
- [Razorpay setup](#razorpay-setup)
- [Database setup & seed data](#database-setup--seed-data)
- [Development commands](#development-commands)
- [Running the backend / admin / mobile app](#running-the-apps)
- [Testing](#testing)
- [Production deployment](#production-deployment)
- [Security model](#security-model)
- [API reference](#api-reference)

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Mobile | Expo SDK 57, React Native 0.86, TypeScript (strict), Expo Router, Reanimated 4, Gesture Handler, TanStack Query, Zustand, expo-secure-store, expo-image, react-native-webview (Razorpay Checkout) |
| Backend | Node.js, Express 5, TypeScript, Zod, JWT, bcrypt, Helmet, CORS, express-rate-limit, multer, supabase-js, razorpay, cloudinary |
| Admin | Vite, React 19, React Router, TanStack Query, Tailwind CSS 4 |
| Database | Supabase PostgreSQL (RLS enabled, RPC functions for atomic writes) |
| Images | Cloudinary (uploads via backend; `f_auto,q_auto,w_*` delivery transforms) |
| Payments | Razorpay Standard Checkout + server-side HMAC signature verification + webhooks |
| Tooling | pnpm workspaces, tsup, tsx, Vitest, EAS Build |

Design system: Cormorant Garamond (editorial headings) + Manrope (UI), café palette (cream `#F8F4EE`, espresso `#1F1A17`, caramel `#C68B59`, beige `#DDB892`, gold `#B98D57`), defined once in `apps/mobile/constants/theme.ts`.

## Monorepo structure

```
food-ordering-app/
├── apps/
│   ├── mobile/                 # Expo customer app (package: mobile)
│   │   ├── app/                # Expo Router screens: (tabs), product/[id], checkout, payment, orders/[id] …
│   │   ├── components/         # ui/ (design system), product/, home/, cart/, checkout/, orders/, brand/
│   │   ├── features/           # data hooks per domain (catalog, cart, orders, addresses, auth, checkout)
│   │   ├── services/           # thin REST clients
│   │   ├── store/              # Zustand: auth (SecureStore), cart & favourites (persisted), checkout
│   │   ├── lib/                # API client, errors, query client, image optimisation, haptics
│   │   ├── constants/          # theme tokens, fonts, config
│   │   ├── app.json · eas.json
│   ├── backend/                # Express API (package: backend)
│   │   ├── src/{config,controllers,middleware,routes,services,validations,utils,types}
│   │   ├── db/migrations/      # SQL schema + RPC functions
│   │   ├── db/seed-data.ts     # 6 categories, 29 products
│   │   ├── scripts/            # migrate.ts, seed.ts, e2e.ts
│   │   ├── tests/              # Vitest: auth, authorization, payments, signatures
│   │   └── Dockerfile
│   └── admin/                  # Vite + React admin panel (package: admin)
├── packages/
│   ├── shared-types/           # API & domain types (@food/shared-types)
│   ├── validation/             # Zod schemas shared by API, admin and mobile (@food/validation)
│   └── config/                 # pricing rules, order status flow, tsconfig base (@food/config)
├── render.yaml                 # Render blueprint (API + admin)
├── .env.example                # reference of every variable
└── pnpm-workspace.yaml
```

Pricing (`calculateOrderTotals`, `resolveSelections`) lives in `@food/config` and is used by the backend (authoritative) and the mobile app (preview only), so numbers always match.

## Installation

Prerequisites: **Node.js ≥ 20**, **pnpm ≥ 10** (`npm i -g pnpm`), a Supabase project, Razorpay test keys, a Cloudinary account. For the mobile app: Expo Go on a phone, or Xcode / Android Studio for simulators.

```bash
pnpm install
cp apps/backend/.env.example apps/backend/.env   # then fill in secrets
cp apps/mobile/.env.example apps/mobile/.env
cp apps/admin/.env.example apps/admin/.env
```

## Environment variables

Secrets live **only** in `apps/backend/.env` (never in `EXPO_PUBLIC_*` / `VITE_*` variables, never in git). See `.env.example` for the full list.

| Variable | Where | Notes |
| --- | --- | --- |
| `PORT`, `NODE_ENV` | backend | defaults `5000`, `development` |
| `CORS_ORIGINS` | backend | comma-separated admin URLs. Native apps send no Origin and are allowed. |
| `TRUST_PROXY` | backend | `1` behind Render/Railway/Fly load balancers (correct client IPs for rate limiting) |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | backend | Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | backend **only** | bypasses RLS — never ship to clients |
| `SUPABASE_DB_URL` | backend (optional) | only for `pnpm db:migrate` |
| `JWT_SECRET` | backend **only** | ≥ 32 chars: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `PAYMENT_PROVIDER` | backend | `razorpay` (default) or `mock` for local development without a Razorpay account (blocked in production) |
| `RAZORPAY_KEY_ID` | backend | sent to clients via `/payments/create-order` (public by design) |
| `RAZORPAY_KEY_SECRET` | backend **only** | used for signature verification |
| `RAZORPAY_WEBHOOK_SECRET` | backend **only** | optional, enables `/api/payments/webhook` |
| `CLOUDINARY_*` | backend **only** | uploads go through the API |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | backend | admin account created by `pnpm db:seed` |
| `EXPO_PUBLIC_API_URL` | mobile | e.g. `http://192.168.1.20:5000/api` (LAN IP for physical devices) |
| `VITE_API_URL` | admin | e.g. `http://localhost:5000/api` |

> Node's `--env-file` treats `#` as a comment: quote values containing `#` or spaces, e.g. `SEED_ADMIN_PASSWORD="p@ss#2026"`.

In production the API refuses to boot if Razorpay or Cloudinary credentials are missing. In development those features return a friendly 503 instead.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. **Project Settings → API**: copy the Project URL → `SUPABASE_URL`, `anon` key → `SUPABASE_ANON_KEY`, `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`.
3. Create the schema (pick one):
   - **SQL editor:** paste and run `apps/backend/db/migrations/001_init.sql`.
   - **CLI:** set `SUPABASE_DB_URL` (Project Settings → Database → Connection string → URI) and run `pnpm db:migrate`.

The migration is idempotent. It creates `users, categories, products, product_images, addresses, orders, order_items, order_status_history, payments`, plus indexes, `updated_at` triggers and RPC functions (`create_order`, `mark_order_paid`, `mark_payment_failed`, `update_order_status`, `set_default_address`, `admin_dashboard_stats`). Every table has **RLS enabled with no policies**, so the anon key can read nothing, and only the backend's service-role key has access.

## Cloudinary setup

1. Create an account at [cloudinary.com](https://cloudinary.com) → Dashboard → API Keys.
2. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (optionally `CLOUDINARY_FOLDER`).
3. Admin uploads: Admin panel → Products/Categories → upload image → `POST /api/admin/uploads` → Cloudinary → the URL and `public_id` are stored on the record. Replaced/deleted images are cleaned up from Cloudinary.
4. The mobile app requests optimised renditions automatically (`f_auto,q_auto,c_limit,w_<px>`), see `apps/mobile/lib/image.ts`.

## Razorpay setup

> **No Razorpay account yet?** Set `PAYMENT_PROVIDER=mock` in `apps/backend/.env`. Checkout then opens a simulated payment sheet (Pay / Simulate failure) instead of Razorpay. The backend still signs the result and runs it through the real `/payments/verify` signature check and order confirmation, so the rest of the flow (tracking, admin, dashboard) behaves exactly as in production. The API refuses to start with `mock` when `NODE_ENV=production`. To switch to the real gateway, add your Razorpay keys and set `PAYMENT_PROVIDER=razorpay`; no code changes are needed.

1. Sign up at [razorpay.com](https://razorpay.com) → switch to **Test Mode** → Settings → API Keys → generate keys.
2. Set `RAZORPAY_KEY_ID` (`rzp_test_…`) and `RAZORPAY_KEY_SECRET` in `apps/backend/.env`.
3. *(Recommended)* Settings → Webhooks → add `https://<api-domain>/api/payments/webhook` with events `payment.captured`, `order.paid`, `payment.failed` and a secret → `RAZORPAY_WEBHOOK_SECRET`. This confirms orders even if the customer closes the app before verification.

**Payment flow:**

```
App → POST /api/payments/create-order { items: [{productId, quantity, selectedOptions}], addressId }
API → re-prices cart from DB, validates availability/options, computes total
API → Razorpay orders.create(amount) → persists order + items + payment atomically (RPC)
App → Razorpay Checkout (WebView, public key only) → customer pays
App → POST /api/payments/verify { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }
API → HMAC-SHA256(order_id|payment_id, KEY_SECRET), timing-safe compare → mark_order_paid (idempotent)
API → order CONFIRMED + PAID → app shows confirmation → live tracking
```

The client never sends prices or totals (they're stripped by validation). Test cards/UPI: see [Razorpay test details](https://razorpay.com/docs/payments/payments/test-card-details/) (e.g. UPI `success@razorpay`).

> Checkout runs inside `react-native-webview` using Razorpay's official `checkout.js`, so it works in **Expo Go** and production builds without a native module. UPI intent links (`upi://`, `phonepe://`…) open the installed apps.

## Database setup & seed data

```bash
pnpm db:migrate                         # needs SUPABASE_DB_URL (or use the SQL editor)
pnpm db:seed                            # 6 categories, 29 products (Unsplash images) + admin user
pnpm --filter backend db:seed -- --cloudinary   # same, but copies every image into your Cloudinary
```

The seed is idempotent (upserts by slug/email). Categories: Pizza, Burgers, Pasta, Desserts, Coffee, Drinks, with realistic descriptions, ingredients, ratings, featured/bestseller flags, limited-time offers (`compare_at_price`) and customization groups (sizes, milks, add-ons).

## Development commands

```bash
pnpm dev                      # backend + admin + mobile in parallel
pnpm dev:api                  # = pnpm --filter backend dev   (http://localhost:5000/api)
pnpm dev:admin                # = pnpm --filter admin dev     (http://localhost:5173)
pnpm dev:mobile               # = pnpm --filter mobile dev    (Expo dev server)
pnpm typecheck                # strict TS across all 6 workspaces
pnpm test                     # Vitest (backend + shared config)
pnpm build                    # backend (tsup) + admin (vite)
pnpm --filter backend e2e     # full end-to-end API journey against a running backend
```

## Running the apps

**Backend:** `pnpm dev:api` → `GET http://localhost:5000/api/health` returns `{ "success": true, "message": "API is running" }`.

**Admin:** `pnpm dev:admin` → http://localhost:5173 → sign in with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`. Only `ADMIN` accounts get in.

**Mobile:**

```bash
cd apps/mobile
npx expo start
# press i (iOS simulator), a (Android emulator), or scan the QR code with Expo Go
```

In development the app talks to the backend on the **same computer that runs Expo** (its LAN address, port 5000), so simulators, emulators and physical phones on the same Wi-Fi all work with no configuration. Set `EXPO_PUBLIC_API_URL` in `apps/mobile/.env` only to use another backend (staging/production) or with `expo start --tunnel`. If a phone shows "You're offline": make sure it's on the same Wi-Fi, the backend is running, and macOS Firewall allows incoming connections for Node.

To make a user an admin manually: `update users set role = 'ADMIN' where email = '…';` in the Supabase SQL editor.

## Testing

- `pnpm test`: 30 unit/integration tests covering pricing and option rules, status transitions, Razorpay payment and webhook signatures (including forgery and tampering), auth, the rule that customers can't call admin APIs (even with a forged role claim), validation, and stripping of client-sent prices.
- `pnpm --filter backend e2e`: 57 checks against a running API and database. Covers register/login, catalog filters and search, address validation, server-side pricing, order creation, forged-signature rejection, verification and idempotency, order privacy, the admin dashboard, status transitions (customer sees each update), product/category CRUD, hiding unavailable products, and webhooks. It signs the verification payload with your `RAZORPAY_KEY_SECRET` exactly as Razorpay does. The actual Razorpay sheet is tested from the app in test mode.

Manual checklist: register → browse → customize → add to cart → checkout → add address → pay (Razorpay test mode) → confirmation → admin sees order → admin changes status → customer timeline updates (polls every 15 s).

## Production deployment

### Backend (Render, Railway, Fly.io, AWS)

- **Render:** `render.yaml` provisions the API (and admin static site). Health check: `/api/health`. Set the secret env vars in the dashboard and `TRUST_PROXY=1`.
- **Docker (Railway/Fly/AWS):** `docker build -f apps/backend/Dockerfile -t ember-oak-api .` (run from the repo root).
- **Generic Node host:** `pnpm install --frozen-lockfile && pnpm --filter backend build && pnpm --filter backend start`.

The API listens on `$PORT`, terminates behind the platform's HTTPS, and handles `SIGTERM` gracefully. Add your admin domain to `CORS_ORIGINS`.

### Admin panel

Any static host (Render static site, Vercel, Netlify, S3+CloudFront): `pnpm --filter admin build` → `apps/admin/dist`, with `VITE_API_URL=https://<api-domain>/api` set at build time and SPA fallback to `index.html`.

### Mobile (EAS Build)

```bash
npm i -g eas-cli && eas login
cd apps/mobile
eas init                                   # links the project, writes the EAS projectId
# edit eas.json → set EXPO_PUBLIC_API_URL for preview/production to your HTTPS API
eas build --platform android --profile preview      # installable APK
eas build --platform android --profile production   # Play Store AAB
eas build --platform ios --profile production       # App Store (requires Apple Developer account)
eas submit --platform android|ios
```

App name **Ember & Oak**, bundle id / package `com.emberandoak.app` (change in `app.json` before the first store build), brand icon, adaptive icon and splash in `apps/mobile/assets/images`.

### Going live checklist

- [ ] Supabase production project migrated + seeded (or catalog entered via admin)
- [ ] Razorpay **live** keys + webhook configured in the hosting platform (not in git)
- [ ] `JWT_SECRET` freshly generated for production
- [ ] `CORS_ORIGINS` = production admin URL, `TRUST_PROXY=1`
- [ ] `EXPO_PUBLIC_API_URL` / `VITE_API_URL` point at the HTTPS API
- [ ] Change the seeded admin password

## Security model

- Clients only talk to the Express API. The Supabase service-role key, Razorpay secret, Cloudinary secret and JWT secret exist only in backend env vars.
- RLS is enabled on every table with no policies, so a leaked anon key exposes nothing.
- bcrypt (12 rounds) password hashing, constant-time login (no user enumeration through timing), and HS256 JWTs with issuer/audience checks.
- The user and role are loaded from the DB on every request, so changing a role or deleting a user takes effect immediately and forged role claims don't work.
- Role-based authorization (`CUSTOMER` / `ADMIN`) on every admin route and on `PATCH /orders/:id/status`.
- Zod validation on every input. Unknown fields (like client prices) are stripped, and errors come back per field.
- Prices are calculated on the server. Orders store purchase-time prices and product snapshots, and order creation and payment confirmation are atomic Postgres functions.
- Payment signatures are verified with HMAC-SHA256 and timing-safe comparison, verification is idempotent, and webhook signatures are checked against the raw body.
- Helmet, an explicit CORS allow-list, rate limits (global, auth and payments), a 200 KB body limit, and image uploads restricted to 5 MB of image MIME types.
- Errors use a central handler: customers see readable messages, and internal details are never returned in production.
- The mobile app stores tokens in the iOS Keychain / Android Keystore via `expo-secure-store`. The cart and favourites (non-sensitive) use AsyncStorage.

Known limitations / next steps: refunds for cancelled paid orders are manual (Razorpay dashboard). Logout is client-side (stateless JWT, 7-day expiry). Order tracking polls every 15 s rather than using push or realtime. Favourites are stored on the device.

## API reference

All responses: `{ success: true, data, message?, meta? }` or `{ success: false, error: { code, message, details? } }`.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | – | health check |
| POST | `/api/auth/register` · `/api/auth/login` | – | returns `{ token, user }` |
| POST | `/api/auth/logout` | user | – |
| GET / PATCH | `/api/auth/me` | user | current user / update name & phone |
| GET | `/api/home` | – | hero, categories, popular, bestsellers, recommended, offers |
| GET | `/api/categories` · `/api/categories/:idOrSlug` | – | active categories |
| GET | `/api/products?category&search&featured&bestseller&page&limit` | – | paginated catalog |
| GET | `/api/products/:idOrSlug` | – | product detail |
| POST | `/api/cart/quote` | – | server-side price preview + availability issues |
| GET / POST | `/api/addresses` | user | list / create |
| PATCH / DELETE | `/api/addresses/:id` | user | update (incl. `isDefault`) / delete |
| GET | `/api/orders` · `/api/orders/:id` | user | own orders |
| POST | `/api/orders/:id/cancel` | user | cancel an unpaid order |
| PATCH | `/api/orders/:id/status` | admin | update status (validated transitions) |
| POST | `/api/payments/create-order` | user | create order + Razorpay order |
| POST | `/api/payments/retry` | user | re-open checkout for an unpaid order |
| POST | `/api/payments/verify` | user | verify signature, confirm order |
| POST | `/api/payments/failed` | user | record failed/cancelled attempt |
| POST | `/api/payments/webhook` | Razorpay signature | async confirmation |
| GET | `/api/admin/dashboard` | admin | metrics, 7-day sales, top products |
| GET / POST | `/api/admin/products` | admin | list (incl. unavailable) / create |
| GET / PATCH / DELETE | `/api/admin/products/:id` | admin | – |
| GET / POST | `/api/admin/categories` | admin | – |
| PATCH / DELETE | `/api/admin/categories/:id` | admin | delete blocked while products exist |
| GET | `/api/admin/orders?status&search&page` · `/api/admin/orders/:id` | admin | orders with customer & payments |
| PATCH | `/api/admin/orders/:id/status` | admin | – |
| POST | `/api/admin/uploads` (multipart `image`, `folder`) | admin | upload to Cloudinary |
