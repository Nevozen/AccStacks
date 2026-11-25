import type { Metadata } from "next";
import { StocksWorkspace } from "@/features/stocks/stocks-workspace";
import { toAccountDetailDto, toStockAccountDto } from "@/features/stocks/dto";
import { AppError } from "@/lib/errors";
import { stockQuerySchema } from "@/schemas/account";
import { getAccountDetail, getAccountGames, getStocksData } from "@/services/accounts";
import { getWorkspace } from "@/server/workspace";

export const metadata: Metadata = { title: "Stocks" };

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function StocksPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { user, settings } = await getWorkspace();
  if (!settings.currency) return null;
  const params = await searchParams;
  const query = stockQuerySchema.parse({
    q: first(params.q),
    game: first(params.game),
    category: first(params.category),
    sort: first(params.sort),
    page: first(params.page),
    view: first(params.view) ?? settings.preferredStockView.toLowerCase(),
  });
  const accountId = first(params.account);
  const [data, games, detail] = await Promise.all([
    getStocksData(user.id, query),
    getAccountGames(user.id),
    accountId
      ? getAccountDetail(user.id, accountId).catch((error: unknown) => {
          if (error instanceof AppError && error.code === "NOT_FOUND") return null;
          throw error;
        })
      : Promise.resolve(null),
  ]);

  return (
    <StocksWorkspace
      accounts={data.accounts.map((account) => toStockAccountDto(account, settings.timezone))}
      counts={data.counts}
      totalAccounts={data.totalAccounts}
      totalFiltered={data.totalFiltered}
      page={data.page}
      totalPages={data.totalPages}
      query={{
        q: query.q,
        game: query.game,
        category: query.category,
        sort: query.sort,
        view: query.view,
      }}
      games={games}
      detail={detail ? toAccountDetailDto(detail, settings.timezone) : null}
      timezone={settings.timezone}
      currency={settings.currency}
      initialAddOpen={first(params.add) === "1"}
    />
  );
}
