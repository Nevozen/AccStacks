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

Use a compact, professional SaaS interface with restrained accents, accessible contrast/focus/keyboard behavior, responsive layouts, loading/empty/error states, and functional controls only. Default to Light theme while supporting Dark and System preferences. The interface is English. Default to IDR and `Asia/Jakarta`; store timestamps in UTC and format them in the user's configured timezone. Format money without fractional Rupiah.

## Financial and lifecycle rules

- Store money as integer Rupiah (`BigInt` at persistence/domain boundaries); never use floating-point money.
- Estimated profit = listing price − purchase price. Net profit = selling price − purchase price − total expenses.
- Margin uses selling/listing price as denominator; ROI uses purchase price. Zero denominators display `N/A`; negative profit is valid.
- The server recomputes all financial results. Never trust client totals or count active listings as revenue.
- Derive account status: SOLD with a completed sale; otherwise LISTED with active listings; otherwise AVAILABLE.
- A sale atomically creates immutable snapshots and expenses, marks the successful listing SOLD, and closes every other active listing. Database uniqueness and transactions prevent duplicate sales.
- Unsold accounts with no active listings may be soft-deleted. Sold accounts and completed sales remain readable and read-only.
- Unrealized profit uses only the highest active asking price per unsold account and is explicitly an estimate.
- Public `accountCode` values use a collision-safe game prefix and per-owner sequence; linked `listingCode` values are sequential per account and never reused after cancellation/deletion. Keep internal database IDs for relations and use public codes in displays/exports/search.
- Group listing cards by account with a stacked summary; independent marketplace operations remain in the account's detail sheet.
- Private thumbnails accept only valid JPEG/PNG/WebP files up to 3 MB. Store them outside `public` and serve only through authenticated, ownership-checked routes with a persistent production volume.
- Capital is required once (`null` is unset; zero is valid). Estimated equity = capital + all-time retained net profit; estimated cash = estimated equity − current inventory value. Inventory is an asset, not equity itself. Comparisons use the immediately preceding equivalent reporting period.

## Security and data

Authenticate and authorize every private operation. Never trust client user IDs, expose cross-user data, store game credentials, commit secrets, render unsafe HTML, or proxy arbitrary image/upload URLs. Validate external URLs and escape CSV cells against formula injection. Use restrictive relations, appropriate indexes, and isolated test databases.

## Validation and Git

Run `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, relevant unit/integration/E2E tests, and `pnpm build` at milestones. Never claim an unexecuted check passed. Integration/E2E tests require Dockerized PostgreSQL and must never target development or production data.

Use focused GitHub Flow branches and actual incremental commits in the form `type(scope): Capitalized imperative summary`. Inspect status and diffs, stage only related files, run relevant checks, and do not bypass hooks. Do not rewrite history, force-push, delete user work, or create empty/artificial commits. Preserve existing documentation and update it only to describe verified behavior.

### Required GitHub workflow for this repository

- `origin` is `https://github.com/Nevozen/AccStacks.git`, `main` is the stable branch, and `feat/initial-application` is the ongoing integration branch.
- After every coherent completed feature or part, inspect `git status` and diffs, run relevant validation, stage only related files, inspect `git diff --cached --check`, and create a real Git commit. Do not leave completed work only in the local working tree.
- Commit messages use English imperative Conventional Commits: `type(scope): Capitalized imperative summary`, preferably at most 72 characters. Include the Devin trailer when applicable: `Generated with [Devin](https://devin.ai)` and `Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>`.
- Immediately after each successful feature commit, push `feat/initial-application` to `origin`, merge that commit into `main` with a fast-forward merge, push `main` to `origin`, switch back to `feat/initial-application`, and continue to the next feature without stopping. Both branches must point to the same commit after each completed merge.
- Use this exact merge sequence when the working tree is clean and history has not diverged:
  1. `git fetch origin`
  2. `git switch main`
  3. `git merge --ff-only origin/main`
  4. `git merge --ff-only feat/initial-application`
  5. `git push origin main`
  6. `git switch feat/initial-application`
- If checks fail, history diverges, or a fast-forward is impossible, stop and report the situation rather than forcing a merge, bypassing hooks, rewriting history, or discarding user changes. Never commit secrets, `.env` files, generated build artifacts, or unrelated changes.
- Releases, external deployments, force-pushes, history rewrites, and merges using a different strategy require explicit user approval. Remote CI was last blocked by a GitHub account billing issue on 2026-11-24; all local checks passed. Re-run CI after that external issue is resolved rather than claiming remote checks passed.

A task is done only when functionality, tests, security, documentation, and meaningful Git commits accurately reflect the implemented work, with any environment limitation disclosed.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
