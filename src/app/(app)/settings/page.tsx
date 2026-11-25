import type { Metadata } from "next";
import { SettingsForm } from "@/features/settings/settings-form";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getSettings } from "@/services/settings";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const settings = await getSettings(user.id);

  return (
    <div className="space-y-grid">
      <PageHeader title="Settings" />
      <div className="grid max-w-5xl items-start gap-grid md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <SettingsForm
          defaultValues={{
            theme: settings.theme,
            timezone: settings.timezone,
            currency: "IDR",
            preferredStockView: settings.preferredStockView,
            capital: settings.capital?.toString() ?? "0",
          }}
        />
        <Card>
          <CardHeader>
            <h2 className="text-[15px] font-semibold">Owner account</h2>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Name</dt>
                <dd className="mt-0.5 font-medium wrap-anywhere">{user.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Email</dt>
                <dd className="mt-0.5 font-medium wrap-anywhere">{user.email}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
