import { overviewQuerySchema } from "@/schemas/overview";
import { getWorkspace } from "@/server/workspace";
import { getAnalytics } from "@/services/analytics";

export type ReportSearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function loadReport(searchParams: ReportSearchParams, view: "overview" | "analytics") {
  const [{ user, settings }, params] = await Promise.all([getWorkspace(), searchParams]);
  const { currency, timezone } = settings;
  if (!currency) return null;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const parsed = overviewQuerySchema.safeParse({
    range: first(params.range),
    from: first(params.from),
    to: first(params.to),
  });
  const query = parsed.success ? parsed.data : { range: "last30" as const };
  const validCustom = query.from && query.to && query.from <= query.to;
  const range = query.range === "custom" && !validCustom ? "last30" : query.range;
  const data = await getAnalytics(user.id, { ...query, range }, timezone, undefined, view);

  return {
    data,
    timezone,
    currency,
    period: { range, from: data.range.fromInput, to: data.range.toInput },
  };
}
