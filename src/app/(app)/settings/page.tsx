import type { Metadata } from "next";
import { SettingsForm } from "@/features/settings/settings-form";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSettings } from "@/services/settings";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const settings = await getSettings(user.id);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Workspace identity and localization preferences." />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Owner account</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Name</p>
            <p className="mt-1 font-medium">{user.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="mt-1 font-medium">{user.email}</p>
          </div>
        </CardContent>
      </Card>
      <SettingsForm
        defaultValues={{
          theme: settings.theme,
          timezone: settings.timezone,
          currency: "IDR",
          preferredStockView: settings.preferredStockView,
          capital: settings.capital?.toString() ?? "0",
        }}
      />
    </div>
  );
}
