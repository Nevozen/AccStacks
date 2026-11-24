import { AppShell } from "@/components/layout/app-shell";
import { CapitalSetupDialog } from "@/features/settings/capital-setup-dialog";
import { getSettings } from "@/services/settings";
import { requireUser } from "@/server/session";
import packageJson from "../../../package.json";

export default async function ApplicationLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const settings = await getSettings(user.id);
  return (
    <AppShell
      user={{ name: user.name ?? "AccStacks Owner", email: user.email ?? "" }}
      version={packageJson.version}
    >
      {children}
      <CapitalSetupDialog open={settings.capital === null} />
    </AppShell>
  );
}
