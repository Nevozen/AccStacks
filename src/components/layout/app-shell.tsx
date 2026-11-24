"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  ChevronsUpDown,
  LayoutDashboard,
  Layers3,
  LogOut,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "./theme-switcher";
import { GlobalSearch } from "./global-search";

const navigation = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/stocks", label: "Stocks", icon: Package },
  { href: "/listings", label: "Listings", icon: Store },
] as const;

function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link href="/overview" className="flex h-12 items-center gap-2.5 px-2">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Layers3 className="size-4" aria-hidden="true" />
      </span>
      {!collapsed ? (
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold tracking-tight">AccStacks</span>
          <span className="block truncate text-[10px] text-muted-foreground">Wardana Dev</span>
        </span>
      ) : null}
    </Link>
  );
}

function Navigation({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1 px-2 py-3" aria-label="Primary navigation">
      {navigation.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        const link = (
          <Link
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-9 items-center gap-3 rounded-md px-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40",
              active && "bg-accent text-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {collapsed ? <span className="sr-only">{label}</span> : label}
          </Link>
        );
        return collapsed ? (
          <Tooltip key={href}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        ) : (
          <div key={href}>{link}</div>
        );
      })}
    </nav>
  );
}

function AccountMenu({
  user,
  collapsed = false,
}: {
  user: { name: string; email: string };
  collapsed?: boolean;
}) {
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          className={cn(collapsed ? "" : "h-auto w-full justify-start gap-2 px-2 py-2")}
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
            {initials || "AS"}
          </span>
          {!collapsed ? (
            <>
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-xs font-medium">{user.name}</span>
                <span className="block truncate text-[10px] font-normal text-muted-foreground">
                  {user.email}
                </span>
              </span>
              <ChevronsUpDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
            </>
          ) : null}
          {collapsed ? <span className="sr-only">Account menu</span> : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-56">
        <DropdownMenuLabel>
          <span className="block text-foreground">{user.name}</span>
          <span className="block truncate">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings aria-hidden="true" /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void signOut({ callbackUrl: "/login" })}>
          <LogOut aria-hidden="true" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarFooter({
  user,
  collapsed,
  version,
}: {
  user: { name: string; email: string };
  collapsed: boolean;
  version: string;
}) {
  return (
    <div className={cn("space-y-1 border-t p-2", collapsed && "flex flex-col items-center")}>
      <ThemeSwitcher collapsed={collapsed} />
      <AccountMenu user={user} collapsed={collapsed} />
      {!collapsed ? (
        <p className="px-2 pt-1 text-[10px] text-muted-foreground">AccStacks v{version}</p>
      ) : null}
    </div>
  );
}

export function AppShell({
  children,
  user,
  version,
}: {
  children: React.ReactNode;
  user: { name: string; email: string };
  version: string;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const title =
    navigation.find((item) => pathname.startsWith(item.href))?.label ??
    (pathname.startsWith("/settings") ? "Settings" : "AccStacks");

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r bg-card transition-[width] lg:flex",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <div
          className={cn(
            "flex items-center border-b px-2",
            collapsed ? "justify-center" : "justify-between",
          )}
        >
          <Brand collapsed={collapsed} />
          {!collapsed ? (
            <Button variant="ghost" size="icon-sm" onClick={() => setCollapsed(true)}>
              <PanelLeftClose aria-hidden="true" />
              <span className="sr-only">Collapse sidebar</span>
            </Button>
          ) : null}
        </div>
        {collapsed ? (
          <div className="flex justify-center pt-2">
            <Button variant="ghost" size="icon-sm" onClick={() => setCollapsed(false)}>
              <PanelLeftOpen aria-hidden="true" />
              <span className="sr-only">Expand sidebar</span>
            </Button>
          </div>
        ) : null}
        <Navigation collapsed={collapsed} />
        <SidebarFooter user={user} collapsed={collapsed} version={version} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 gap-0 p-0 lg:hidden">
          <div className="border-b px-2 py-1">
            <Brand />
          </div>
          <SheetTitle className="sr-only">Application navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Navigate between AccStacks modules
          </SheetDescription>
          <Navigation onNavigate={() => setMobileOpen(false)} />
          <SidebarFooter user={user} collapsed={false} version={version} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur md:px-6">
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu aria-hidden="true" />
            <span className="sr-only">Open navigation</span>
          </Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{title}</p>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Stack Accounts. Track Profits.
            </p>
          </div>
          <div className="ml-auto">
            <GlobalSearch />
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
