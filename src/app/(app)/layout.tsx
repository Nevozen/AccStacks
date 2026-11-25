import { AppShell } from "@/components/layout/app-shell";
import { CapitalSetupDialog } from "@/features/settings/capital-setup-dialog";
import { CurrencySetupDialog } from "@/features/settings/currency-setup-dialog";
import { getWorkspace } from "@/server/workspace";

export default async function ApplicationLayout({ children }: { children: React.ReactNode }) {
  const { user, settings } = await getWorkspace();
  return (
    <AppShell user={{ name: user.name ?? "AccStacks Owner", email: user.email ?? "" }}>
      {settings.currency ? (
        <>
          {children}
          <CapitalSetupDialog currency={settings.currency} open={settings.capital === null} />
        </>
      ) : (
        <CurrencySetupDialog />
      )}
    </AppShell>
  );
}
