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

## Capital, assets, cash, and equity

Owner capital is required once and may be zero. `null` means capital has not been entered; zero is a valid intentional value.

```text
Retained Net Profit = All-time completed-sale net profit
Estimated Equity = Capital + Retained Net Profit
Estimated Cash = Estimated Equity - Current Inventory Value
Estimated Assets = Estimated Cash + Current Inventory Value
```

Inventory is an asset, not equity by itself. The simplified model assumes no liabilities, owner withdrawals, or non-cash adjustments. Estimated assets and equity therefore reconcile to the same total, while the cash and inventory breakdown explains where that value sits. Capital and retained profit are not affected by the selected sales reporting period.

Revenue, net profit, and sale-count indicators compare the current reporting period with the immediately preceding equivalent period. Last 7/30 days and custom ranges use the same duration; calendar months/years use the previous calendar month/year. All-time reports do not show a comparison. If the previous value is zero, reports do not show a growth percentage.

## Dates

Timestamps are stored in UTC. Current reporting boundaries and displayed dates use the configured user timezone, default `Asia/Jakarta`. The reporting period applies only to sales-related metrics and charts.

### Existing timezone limitations

- Purchase, listing, and sale date writes still interpret date-only input at midnight in `Asia/Jakarta`, even if a different display or reporting timezone is selected.
- Calendar-month and calendar-year comparisons shift the prior boundary in the server timezone. A timezone offset change in the reporting timezone can move the comparison cutoff. For example, on a UTC server, an April report in `America/New_York` begins its March comparison at 04:00 UTC instead of 05:00 UTC.
