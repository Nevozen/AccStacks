import type { Metadata } from "next";
import { OverviewWorkspace } from "@/features/overview/overview-workspace";
import { toOverviewDto } from "@/features/overview/dto";
import { overviewQuerySchema } from "@/schemas/overview";
import { getAnalytics } from "@/services/analytics";
import { db } from "@/server/db";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const query = overviewQuerySchema.parse({
    range: first(params.range),
    from: first(params.from),
    to: first(params.to),
  });
  const settings = await db.userSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });
  const analytics = await getAnalytics(user.id, query, settings.timezone);

  return (
    <OverviewWorkspace
      data={toOverviewDto(analytics, settings.timezone, query)}
      timezone={settings.timezone}
    />
  );
}
