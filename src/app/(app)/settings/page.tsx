import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { db } from "@/server/db";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const settings = await db.userSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });
  const rows = [
    ["Name", user.name ?? "AccStacks Owner"],
    ["Email", user.email ?? ""],
    ["Currency", settings.currency],
    ["Timezone", settings.timezone],
    ["Preferred stock view", settings.preferredStockView],
    ["Theme preference", settings.theme],
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Workspace identity and localization preferences." />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Workspace preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.map(([label, value]) => (
            <div key={label} className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:items-center">
              <Label>{label}</Label>
              <p className="text-sm text-muted-foreground">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
