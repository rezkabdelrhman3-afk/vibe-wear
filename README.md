# MASHY / 24

A working full-stack concept store for MASHY: modern lifestyle essentials, beginning with Chapter 01 / Socks. Built from the supplied brand brief and imagery. English is the public language. This is a **demo commerce environment**, not a published live shop.

## What is implemented

- Responsive editorial homepage, animated /24 timeline, reduced-motion support, collection and search pages with URL filters, product galleries, variants, stock states, persistent cart drawer, guest checkout, and private order tracking.
- PostgreSQL-backed catalog, customers, orders, payment records, variant inventory, discounts, governorate shipping rates, content, settings, media, support inquiries, staff accounts, audit records, and transactional email outbox.
- Protected Admin and Editor workspace. Products, variants, collections, content, campaign blocks, FAQs, policy copy, shipping, discounts, settings, inventory, orders, internal notes, and customer details can be managed without source edits.
- Serializable checkout transactions, conditional stock reservations, idempotent order creation, integer money, order snapshots, payment/fulfillment separation, and reservation release on failed or expired payments.
- Safe simulated card/wallet payments and cash-on-delivery workflow. Paymob intention/webhook adapter, Resend email adapter, S3-compatible image storage, and local development uploads.
- SEO metadata, product/organization/breadcrumb JSON-LD, sitemap, and robots. Demo indexing is disabled and demo products omit purchasable structured offers.

## Stack

Next.js 16.4 App Router, React 19, strict TypeScript, PostgreSQL 17, Prisma 6.19 with the JavaScript PostgreSQL adapter, Tailwind 4 plus an editorial CSS system, native CSS/IntersectionObserver motion, Zod, bcrypt, JOSE, Vitest, and Playwright. Node.js 24 was used for validation. Use the committed npm lockfile.

## Local setup

```bash
npm ci
cp .env.example .env
```

Edit `.env`: set unique random `AUTH_SECRET` and `CRON_SECRET` values (at least 32 characters). Use the sample database credentials for disposable local development only. Never commit `.env`.

```bash
npm run db:up
# Wait until PostgreSQL is accepting connections.
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

The app listens on port 3000. `APP_URL` must match the exact browser origin for mutation requests. Staff login is `/admin/login` and the workspace is `/admin`.

`db:up` starts the existing `mashy-postgres` container, or creates one from the local `DATABASE_URL`. It binds PostgreSQL to loopback and retains data in the `mashy-pgdata` Docker volume. Alternatively, use `docker compose up -d db` instead of `db:up`; do not run both on the same port. With Compose, match `POSTGRES_PASSWORD` to `DATABASE_URL`. Existing Docker volumes keep their original database credentials.

The current cloud instance has a loopback-only development PostgreSQL container and a private `.env`. An ignored `.local/dev-db.dump` retains a development snapshot. `npm run db:restore` restores it only into a completely empty local database; existing tables are never overwritten. Setup does not require payment, email, or storage credentials in demo mode.

Run maintenance in a second terminal:

```bash
npm run worker
```

It releases expired online-payment reservations and delivers queued email when Resend is configured. COD orders do not expire automatically. For serverless hosting, schedule authenticated `POST /api/jobs` requests every minute using `Authorization: Bearer <CRON_SECRET>`. No credentials belong in the URL.

### Create a staff account

There is no default admin or public password. In Bash:

```bash
read -r -s -p 'New password (14–72 characters): ' MASHY_ADMIN_PASSWORD
printf '\n'
printf '%s' "$MASHY_ADMIN_PASSWORD" | npm run admin:create -- owner@example.com 'Mashy Owner' ADMIN
unset MASHY_ADMIN_PASSWORD
```

Use `EDITOR` instead of `ADMIN` for catalog/content/media staff. Re-running this command updates the account and revokes existing sessions. Passwords are bcrypt-hashed. Production session cookies are Secure, HttpOnly, SameSite=Lax, and expire after eight hours. API writes enforce origin, authorization, and a session-bound CSRF token. Login is rate limited in PostgreSQL. Only enable `TRUST_PROXY=true` when a trusted proxy overwrites incoming forwarding headers.

## Demo content and store operations

Seed is additive and preserves existing records. It creates six editable concept products, twelve variants, all 27 Egyptian governorates, an illustrative 1,000 EGP free-shipping threshold, FAQs, and the `FIRSTMOVE` demo code (10% above 300 EGP, limited use). Money is stored and entered in **piasters**: `22000 = 220 EGP`.

Product images are supplied concept assets, not evidence of final materials, performance, or packaging. No material or wear-duration claims are inferred. One product is seeded sold out and another low stock to exercise those states.

In the admin:

- Create/edit products, then manage their color/size/SKU combinations in Variants. Product and collection IDs are shown in their tables. Archive products instead of deleting order history.
- Content keys `hero`, `philosophy`, `chapter`, `story`, and `footer` control the corresponding editable sections. `faq-*` creates FAQs. `campaign-*` adds homepage campaign blocks. `policy-privacy`, `policy-terms`, and `policy-shipping-returns` replace the policy drafts.
- Upload image media and copy its URL into a product or content section. Images are decoded, resized, and re-encoded to WebP; SVG uploads are not accepted. Local uploads are development-only. Configure S3 for production. Video is supported through hosted HTTPS URLs.
- Shipping rates, free-shipping threshold, low-stock threshold, announcement, support contact, WhatsApp, and metadata are editable. Blank WhatsApp hides that option.
- Discounts support fixed/percentage, minimum value, validity dates, usage limits, per-email single use, and automatic selection of the best eligible discount. One discount applies per order; bundles are a future extension.
- Payment state is separate from fulfillment. Orders progress through Pending → Confirmed → Preparing → Shipped → Delivered; return/refund states are available. Online payments must be confirmed by the provider. COD collection is recorded after shipping. Refund recording does **not** execute a financial refund; confirm it with the provider first. Returned stock requires inspection and an explicit stock adjustment.
- Contact submissions appear in Inquiries. They are not automatically sent as outbound messages.

## Environment variables

See `.env.example` for the full list. Important groups:

| Group               | Variables                                                                                                                | Default behavior                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| Database and origin | `DATABASE_URL`, `APP_URL`                                                                                                | Local PostgreSQL and port 3000                    |
| Security            | `AUTH_SECRET`, `CRON_SECRET`, `TRUST_PROXY`                                                                              | Unique secrets required; proxy trust disabled     |
| Commerce            | `COMMERCE_MODE`, `PAYMENT_PROVIDER`                                                                                      | `demo`, `mock`; no real charges                   |
| Paymob              | `PAYMOB_SECRET_KEY`, `PAYMOB_PUBLIC_KEY`, `PAYMOB_HMAC_SECRET`, `PAYMOB_INTEGRATION_IDS`                                 | Unconfigured; integration IDs are comma separated |
| Email               | `EMAIL_PROVIDER`, `RESEND_API_KEY`, `EMAIL_FROM`                                                                         | `outbox`; emails remain in PostgreSQL             |
| Media               | `STORAGE_PROVIDER`, `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL` | Local development; S3 for production              |

Mock payment endpoints return 404 in live mode. Real payment initiation cannot use the mock provider in live mode. Paymob, Resend, and S3 adapters have **not** been exercised against live accounts. Before enabling them, validate the current provider contract, credentials, webhook reference mapping, settlement/refund lifecycle, email domain, and storage CORS/public URL configuration in provider sandboxes. Late successful payments after reservation release require manual refund review and return a non-success webhook response rather than confirming an unfulfillable order.

## Testing

Use a disposable seeded database, never a production database.

```bash
npm run typecheck
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
npm run build
npm start
```

Vitest tests use unique database fixtures and remove them. Playwright tests create clearly marked `@example.test` orders; these remain available for inspection in the demo admin and consume demo stock. Repeated test runs may require resetting **demo** stock in admin. Staff fixtures are removed automatically. The two browser projects test desktop and mobile Chromium; this is not a Safari certification.

On this cloud machine, browsers are installed at `/workspace/.cache/ms-playwright`; use `PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright npm run test:e2e`.

Critical checks cover product loading, variants, cart quantity, checkout, server totals, concurrent overselling, idempotency, stock release, discount limits, payment amount checks, duplicate payment events, signature tampering, staff content persistence, RBAC, CSRF, keyboard dialog dismissal, and responsive overflow.

## Architecture

```text
src/app/             Server-rendered routes, metadata, and HTTP endpoints
src/components/      Storefront and staff interface components
src/domain/          Checkout, inventory, discounts, and maintenance logic
src/integrations/    Payment, email, and media adapters
src/lib/             Database, authentication, catalog, analytics, localization
prisma/              Schema, versioned migrations, editable seed data
scripts/             Staff provisioning, local PostgreSQL, maintenance worker
tests/               Database integration and browser tests
```

Prices, stock, shipping, and discount decisions come from the server. Browser bag prices are indicative until checkout validates them. Catalog types are category/chapter driven, not sock-specific. Orders snapshot the purchased variant and price. Future accounts/wishlists can link to `Customer`; future journal/lookbook/chapter pages can use `Content` and `Collection`; bundle pricing belongs in the domain layer before inventory reservation.

`src/lib/i18n.ts` defines typed English/Arabic dictionaries and direction metadata. Arabic storefront content and routes are **not enabled**; complete approved translations and RTL layout testing before adding a language switch.

The centralized analytics module is consent-gated and ships with no vendor tracking. Register an adapter for GA4/Meta/TikTok only after implementing a consent UI and updating the privacy notice. No fabricated conversion metrics are shown.

## Deployment

Vercel + managed PostgreSQL is a suitable target. Any Node-capable host also works.

1. Provision PostgreSQL with TLS, backups, and an appropriate connection limit/pool. Set production variables in the host's secure settings. Use a direct connection for migrations if your provider requires one.
2. Run `npm ci`, `npm run db:generate`, and `npm run db:migrate` in the release pipeline. Seed only a new demo/staging database; replace concepts before live sales.
3. Run `npm run build`; use `npm start` on a Node host. Vercel detects Next.js automatically. No domain logic depends on Vercel.
4. Set `APP_URL` to the exact HTTPS storefront origin. Configure S3 storage and transactional email. Schedule the maintenance endpoint or run one worker process.
5. Provision staff privately. Validate Paymob sandbox creation, signed webhook delivery, duplicate/late events, all enabled payment methods, and external refunds. Only then use live credentials and `COMMERCE_MODE=live`.
6. Replace all demo data and policy drafts. Confirm product specifications, prices, taxes, delivery commitments, returns/hygiene rules, merchant identity, support contacts, and rights to use the supplied imagery. Complete accessibility and performance testing on real devices and monitoring/backup restoration checks.

The environment currently runs the application locally. It has not been deployed to Vercel, connected to `mashy24.com`, or published as a public website. A successful build is not verification of live payment processing or legal readiness.

## Verification in this workspace

- TypeScript, ESLint, and optimized production build passed.
- 12 database/unit integration tests passed.
- 20 Playwright tests passed across desktop and mobile Chromium, including eight axe WCAG A/AA baseline scans and responsive checks at 320–1920px. Automated scans are not a complete accessibility certification.
- Snapshot restoration was verified in a disposable PostgreSQL database.
- Production HTTP startup was checked independently of the development server.

Actual captures: [desktop homepage](docs/homepage.png) and [mobile opening](docs/mobile.png).

## Private Vercel preview

Vercel deployments are password gated by `src/proxy.ts`, including images and API routes. Set `PREVIEW_PASSWORD` to a unique password of at least 16 characters. The browser username is `mashy`. Missing/short preview passwords produce HTTP 503; unauthenticated requests produce HTTP 401. No password is committed to Git. The password gate is intentionally always enabled on Vercel until a separate, explicit public-launch change. Live provider webhooks cannot cross this preview gate; keep mock payments enabled.

For this demo use Vercel's Next.js preset, root `./`, and build command `npm run vercel-build`. It generates Prisma, applies migrations, seeds additive demo data, and builds. Required dashboard variables: `DATABASE_URL` (a dedicated TLS-enabled demo PostgreSQL database), `AUTH_SECRET` (32+ random characters), and `PREVIEW_PASSWORD` (16+ characters). Set `COMMERCE_MODE=demo`, `PAYMENT_PROVIDER=mock`, and `EMAIL_PROVIDER=outbox`. `APP_URL` may be omitted on Vercel because its deployment/production hostnames are trusted explicitly. Do not use the demo build command against a live-sales database.
