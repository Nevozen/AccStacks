# Financial and Account Lifecycle Rules

## Monetary representation

All monetary values are whole Indonesian Rupiah stored as PostgreSQL `BIGINT` and handled as JavaScript `BigInt` at persistence/domain boundaries. Floating-point money is not used. Client previews are advisory; the server recalculates and stores authoritative sale values.

## Formulas

```text
Estimated Profit = Listing Price - Purchase Price
Estimated Profit Margin = Estimated Profit / Listing Price × 100
Net Profit = Actual Selling Price - Purchase Price - Total Additional Expenses
Profit Margin = Net Profit / Actual Selling Price × 100
ROI = Net Profit / Purchase Price × 100
Total Net Profit = Revenue - COGS - Additional Expenses
Aggregate Margin = Total Net Profit / Revenue × 100
Aggregate ROI = Total Net Profit / COGS × 100
```

Zero denominators produce `N/A`. Percentages use integer-ratio calculations and round to at most two decimal places for display. Loss-making sales are valid and remain in history. Average Rupiah values round to the nearest whole Rupiah.

## Inventory and sales

- Total revenue, COGS, expenses, profit, and recent sales use completed sales in the selected reporting period.
- Current inventory counts, active listings, inventory value, and unrealized profit always use current records.
- Inventory value is the purchase cost of unsold, non-deleted accounts.
- COGS includes only purchase-price snapshots from completed sales, never unsold stock.
- Unrealized profit is an estimate: for each unsold account, highest active asking price minus purchase price. Available accounts without an active asking price contribute no estimate. Multiple marketplaces never multiply one account's value.
- Completed sales keep immutable purchase and original-listing snapshots, actual sale price, itemized expenses, totals, and net profit.

## Account status

Status is derived rather than manually assigned:

- `SOLD`: a completed sale exists.
- `LISTED`: unsold and at least one active listing exists.
- `AVAILABLE`: unsold and no active listings exist.

A confirmed sale locks the account row in a serializable transaction, validates ownership and active-listing state, creates the sale and expenses, marks the selected listing `SOLD`, and closes all other active listings as `CLOSED`. Unique account/listing sale constraints provide a final duplicate-sale safeguard.

Deleting a listing means `CANCELLED` in AccStacks, not deleting the account or its history. Account deletion is soft archival and is allowed only for unsold accounts with no active listings. Completed sales are read-only.

Closing or cancelling a listing never removes an advertisement from an external marketplace. Users must remove those advertisements manually.

## Dates

Timestamps are stored in UTC. Date-only inputs and reporting boundaries are interpreted in the configured user timezone, default `Asia/Jakarta`. The current reporting period applies only to sales-related metrics and charts.
