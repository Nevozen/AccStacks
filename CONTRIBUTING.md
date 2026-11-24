# Contributing to AccStacks

## Development principles

- Keep the application modular, typed, and focused on the account trading lifecycle.
- Never store game account passwords, recovery codes, session tokens, or other credentials.
- Keep financial calculations on the server and use integer Rupiah values, never floating-point money.
- Preserve completed sales as immutable financial history.
- Enforce record ownership and validate every mutation on the server.
- Preserve unrelated user changes and never commit environment secrets.

## Workflow

1. Create a focused branch from `main` using `feat/*`, `fix/*`, `refactor/*`, `docs/*`, or `chore/*`.
2. Make one coherent change at a time and add relevant tests.
3. Run `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, relevant tests, and `pnpm build` for milestone changes.
4. Inspect unstaged and staged diffs before committing.
5. Commit using `type(scope): Capitalized imperative summary`, for example `feat(stocks): Add account creation workflow`.
6. Do not use `--no-verify` to hide failing checks and do not push without repository owner approval.

Database integration and end-to-end tests require a separate PostgreSQL test database. Never run destructive test setup against a development or production database.

## Definition of done

A change is complete when its functionality works, authorization and validation are enforced, relevant checks pass, documentation remains accurate, and the Git diff contains only the intended unit of work.
