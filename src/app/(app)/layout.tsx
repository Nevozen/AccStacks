import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/server/session";
import packageJson from "../../../package.json";

export default async function ApplicationLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <AppShell
      user={{ name: user.name ?? "AccStacks Owner", email: user.email ?? "" }}
      version={packageJson.version}
    >
      {children}
    </AppShell>
  );
}
