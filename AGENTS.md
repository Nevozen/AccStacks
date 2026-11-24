# AccStacks Agent Instructions

## Project

AccStacks by Wardana Dev is a private game-account reseller management application. Its lifecycle is purchase → stock → one or more external marketplace listings → sale and expenses → close related listings → sold history → analytics. It is not a public marketplace and does not integrate with or remove external advertisements.

## Stack and architecture

- Next.js App Router, React, strict TypeScript, Tailwind CSS, shadcn/ui and Radix primitives.
- PostgreSQL, Prisma, Auth.js, Zod, React Hook Form, Recharts, Vitest, and Playwright.
- Modular monolith: Server Components read through services; Server Actions and protected Route Handlers call the same services.
- Keep presentation in `src/features` and `src/components`, business operations in `src/services`, request/session infrastructure in `src/server`, validation in `src/schemas`, and pure domain rules in `src/lib`.
- Avoid duplicate business rules, unnecessary dependencies, client-side aggregation of large datasets, and speculative abstractions.

## UI and localization

Use a compact, professional SaaS interface with restrained accents, accessible contrast/focus/keyboard behavior, responsive layouts, loading/empty/error states, and functional controls only. Support light, dark, and system themes. The interface is English. Default to IDR and `Asia/Jakarta`; store timestamps in UTC and format them in the user's configured timezone. Format money without fractional Rupiah.

## Financial and lifecycle rules

- Store money as integer Rupiah (`BigInt` at persistence/domain boundaries); never use floating-point money.
- Estimated profit = listing price − purchase price. Net profit = selling price − purchase price − total expenses.
- Margin uses selling/listing price as denominator; ROI uses purchase price. Zero denominators display `N/A`; negative profit is valid.
- The server recomputes all financial results. Never trust client totals or count active listings as revenue.
- Derive account status: SOLD with a completed sale; otherwise LISTED with active listings; otherwise AVAILABLE.
- A sale atomically creates immutable snapshots and expenses, marks the successful listing SOLD, and closes every other active listing. Database uniqueness and transactions prevent duplicate sales.
- Unsold accounts with no active listings may be soft-deleted. Sold accounts and completed sales remain readable and read-only.
- Unrealized profit uses only the highest active asking price per unsold account and is explicitly an estimate.

## Security and data

Authenticate and authorize every private operation. Never trust client user IDs, expose cross-user data, store game credentials, commit secrets, render unsafe HTML, or proxy arbitrary image/upload URLs. Validate external URLs and escape CSV cells against formula injection. Use restrictive relations, appropriate indexes, and isolated test databases.

## Validation and Git

Run `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, relevant unit/integration/E2E tests, and `pnpm build` at milestones. Never claim an unexecuted check passed. Integration/E2E tests require Dockerized PostgreSQL and must never target development or production data.

Use focused GitHub Flow branches and actual incremental commits in the form `type(scope): Capitalized imperative summary`. Inspect status and diffs, stage only related files, run relevant checks, and do not bypass hooks. Do not rewrite history, force-push, delete user work, or create empty/artificial commits. For the current `feat/initial-application` workflow, push every successful feature commit, merge each completed and validated feature into `main`, push `main`, and continue to the next feature without stopping. Releases and external deployments still require explicit approval. Preserve existing documentation and update it only to describe verified behavior.

A task is done only when functionality, tests, security, documentation, and meaningful Git commits accurately reflect the implemented work, with any environment limitation disclosed.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
