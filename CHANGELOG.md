# Changelog

All notable changes to AccStacks are documented in this file. The format follows Keep a Changelog and the project uses Semantic Versioning.

## Unreleased

### Added

- A public, light-by-default landing page with a sample sale and a guide to the reseller workflow.
- Self-service registration with password validation, rate limiting, and a private workspace with starting-capital setup.
- Initial Next.js application foundation and repository quality tooling.
- PostgreSQL inventory, listing, sale, expense, settings, and authentication-throttling schema.
- Centralized integer-Rupiah financial calculations, date ranges, and account status rules.
- Explicit development seed and private owner provisioning commands.
- Private Auth.js sign-in, persistent JWT sessions, protected routes, and login throttling.
- Responsive AccStacks dashboard shell with light, dark, and system themes.
- Reusable accessible form, navigation, dialog, table, feedback, and status components.
- Complete account inventory creation, editing, archival, filtering, sorting, pagination, and detail history.
- Available, listed, and sold categories with persistent grid/table preferences and sold-record protections.
- Independent multi-marketplace listings with custom normalized marketplace names and duplicate warnings.
- Listing search, filtering, pagination, editing, cancellation, and live profit, margin, and ROI estimates.
- Atomic sale confirmation with dynamic expenses, loss handling, financial snapshots, and concurrent-sale protection.
- Automatic closure of related listings and permanent read-only sold-account financial history.
- Database-backed inventory and financial KPIs with timezone-aware reporting periods.
- Revenue, profit, inventory, game, marketplace, and holding-period analytics with recent sales.
- Global account search and persistent theme, timezone, and stock-view preferences.
- Protected inventory, listing, sales, and financial-summary CSV exports with formula-injection protection.
- End-to-end account lifecycle, authorization, validation, theme, mobile, loss-sale, and duplicate-submission coverage.
- Production Docker images, private PostgreSQL Compose deployment, explicit migrations, and health checks.
- GitHub Actions quality, integration, and Playwright pipelines plus self-hosting and backup documentation.
- Per-owner game-prefixed account IDs and linked sequential listing IDs with collision-safe backfill.
- Expanded popular-game autocomplete with free-text selection and no dropdown-only input.
- Stacked account-level listing cards with a complete independent-marketplace detail sheet.
- Private local thumbnail uploads with type validation, ownership-checked serving, and persistent storage.
- Previous-period revenue, net-profit, and sale-count comparison indicators.
- Required owner capital with retained-profit, cash, asset, and estimated-equity reporting.
- Production-server Playwright execution for stable end-to-end verification.
- Inline listing expansion with unstack/restack motion and Close all instead of a side sheet.
- Expanded groups now lead the listing grid, while single-listing accounts show direct actions without Show all.
- Stocks now default to Available, Listed, then Sold, with alphabetical account names within each status.
- Removed verbose capital/equity explanatory text from Overview and made Light the default theme.
