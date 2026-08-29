# Yobuy Independent Store Upgrade Implementation Plan

> **For agentic workers:** This plan is executed inline in the current session. Steps use checkbox syntax for tracking.

**Goal:** Upgrade Yobuy to a polished, configurable single-store experience on Next 16 while preserving existing backend providers.

**Architecture:** Keep App Router, Prisma and Zustand. Upgrade runtime first, then replace the shared storefront shell and improve the catalog/cart vertical slice before widening to account/admin polish.

**Tech Stack:** Next 16.3.x, React 19.x, TypeScript, Tailwind CSS 4, Radix/shadcn components, Zustand, Prisma.

**Spec:** `docs/superpowers/specs/2026-08-29-independent-store-design.md`

## Global Constraints

- Node runtime must be >=20.9.0 for Next 16.
- No new production dependencies unless an existing installed package cannot cover the requirement.
- Preserve user data, payment integrations, auth, and existing API contracts.
- Do not disable TypeScript or ESLint errors in the final build.

### Task 1: Runtime and Dependency Upgrade

**Files:** `package.json`, `pnpm-lock.yaml`, `next.config.mjs`, `.nvmrc` or `engines` metadata.

- Set Next and `eslint-config-next` to `16.3.3`, align React/types, and add an explicit Node >=20.9 engine.
- Regenerate the pnpm lockfile with pnpm 8 under Node 16 if needed, then verify with Node 20.
- Remove `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` once the affected diagnostics are fixed.

**Test:** run `pnpm type-check`, `pnpm lint`, and `pnpm build` under Node 20.

### Task 2: Storefront Shell and Cart Drawer

**Files:** `src/components/layout/shadcn-header.tsx`, `src/components/layout/conditional-layout.tsx`, `src/components/cart/cart-drawer.tsx`, `src/store/cart-store.ts`, `src/app/globals.css`.

- Add a shared cart drawer with item count, subtotal, quantity controls, remove action, empty state, and checkout CTA.
- Keep drawer state in the existing cart store and expose a single `openCart` path from all add-to-cart actions.
- Make search submit to `/products?search=...`, preserve locale path, and close mobile menus after navigation.
- Add a mobile bottom action bar only where it does not overlap checkout/admin routes.

**Test:** add a focused store test for quantity merge, count/subtotal derivation, and drawer state.

### Task 3: Catalog and Product Interaction

**Files:** `src/components/products/product-card.tsx`, `src/components/products/product-list-client.tsx`, `src/components/products/product-search.tsx`, `src/app/products/page.tsx`.

- Add debounced search submission, filter reset, responsive result summary, skeleton transition and retry state.
- Make cards stable in height, use native image loading, and expose clear keyboard/focus states.
- Prevent duplicate add-to-cart requests and show a direct cart-drawer confirmation.

**Test:** cover query-string construction and loading/error transitions.

### Task 4: Checkout Recovery and Operational Completeness

**Files:** `src/app/(shop)/checkout/page.tsx`, `src/lib/pricing.ts`, relevant API routes and translations.

- Preserve form values on validation/payment failures and distinguish recoverable errors from terminal errors.
- Validate inventory and coupon results before creating payment intent; disable duplicate submission while pending.
- Add delivery estimate, tax/shipping breakdown and actionable empty/error states.

**Test:** focused pricing and checkout validation tests.

### Task 5: Verification and Responsive QA

- Run fresh type-check, lint, unit tests and production build under Node 20.
- Run the Impeccable detector on changed UI files.
- Use browser verification for desktop/mobile core flows and record remaining risks.
