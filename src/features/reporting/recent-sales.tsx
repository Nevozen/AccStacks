import Link from "next/link";
import { Money } from "@/components/shared/money";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/dates";
import type { Currency } from "@/lib/money";
import { ReportLink, ReportPanel, type ReportProps } from "./report-ui";

export function RecentSales({
  sales,
  timezone,
  currency,
}: {
  sales: ReportProps["data"]["recentSales"];
  timezone: string;
  currency: Currency;
}) {
  return (
    <ReportPanel
      id="recent-sales"
      title="Recent sales"
      scope="Selected period"
      className="md:col-span-12"
      action={
        <ReportLink href="/stocks?category=sold&sort=saleNewest&view=table">
          View all sales
        </ReportLink>
      }
    >
      {sales.length ? (
        <Table scrollLabel="Recent sales transactions">
          <TableHeader>
            <TableRow>
              <TableHead className="pl-panel">Account</TableHead>
              <TableHead className="hidden lg:table-cell">Game</TableHead>
              <TableHead className="px-2 sm:px-3">Marketplace</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Selling price</TableHead>
              <TableHead className="pr-panel pl-2 text-right md:pr-3">
                <span className="block sm:hidden">Selling price</span>
                <span className="block font-normal sm:font-medium">Net profit</span>
              </TableHead>
              <TableHead className="hidden pr-panel md:table-cell">Sale date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="max-w-64 pl-panel">
                  <Link
                    href={`/stocks?category=sold&account=${sale.account.id}`}
                    className="rounded-sm font-semibold wrap-anywhere hover:underline"
                  >
                    {sale.account.accountName}
                  </Link>
                  <p className="mt-0.5 font-mono text-[11px] wrap-anywhere text-muted-foreground">
                    {sale.account.accountCode}
                  </p>
                  <p className="text-xs wrap-anywhere text-muted-foreground lg:hidden">
                    {sale.account.gameName}
                  </p>
                </TableCell>
                <TableCell className="hidden max-w-48 wrap-anywhere lg:table-cell">
                  {sale.account.gameName}
                </TableCell>
                <TableCell className="max-w-40 px-2 wrap-anywhere sm:px-3">
                  {sale.marketplace}
                  <p className="mt-0.5 text-xs text-muted-foreground md:hidden">
                    {formatDate(sale.soldAt, timezone)}
                  </p>
                </TableCell>
                <TableCell className="hidden text-right whitespace-nowrap sm:table-cell">
                  <Money currency={currency} value={sale.sellingPrice} />
                </TableCell>
                <TableCell className="pr-panel pl-2 text-right wrap-anywhere md:pr-3">
                  <Money
                    currency={currency}
                    value={sale.sellingPrice}
                    className="block sm:hidden"
                  />
                  <Money
                    currency={currency}
                    value={sale.netProfit}
                    colored
                    className="text-xs sm:text-sm"
                  />
                </TableCell>
                <TableCell className="hidden pr-panel whitespace-nowrap md:table-cell">
                  {formatDate(sale.soldAt, timezone)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="px-panel pb-panel text-sm text-muted-foreground">
          No transactions in the selected period.
        </p>
      )}
    </ReportPanel>
  );
}
