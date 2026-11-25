"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  ChartNoAxesCombined,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Store,
  type LucideIcon,
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "./theme-switcher";
import { GlobalSearch } from "./global-search";
import { BrandMark } from "./public-brand";

const navigation = [
  {
    label: "Business",
    links: [
      { href: "/overview", label: "Overview", icon: LayoutDashboard },
      { href: "/analytics", label: "Analytics", icon: ChartNoAxesCombined },
    ],
  },
  {
    label: "Inventory",
    links: [
      { href: "/stocks", label: "Stocks", icon: Package },
      { href: "/listings", label: "Listings", icon: Store },
    ],
  },
] as const;

function WorkspaceBrand({
  collapsed = false,
  onClick,
}: {
  collapsed?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href="/overview"
      onClick={onClick}
      className="inline-flex w-fit items-center gap-2.5 rounded-lg"
    >
      <BrandMark className="bg-equity text-equity-foreground" />
      <span className={cn("text-base font-semibold tracking-[-0.045em]", collapsed && "sr-only")}>
        AccStacks
      </span>
    </Link>
  );
}

function NavigationLink({
  href,
  label,
  icon: Icon,
  collapsed,
  onClick,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  const link = (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex min-h-10 items-center gap-2.5 rounded-md px-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
        active &&
          "bg-accent font-semibold text-accent-foreground hover:bg-accent hover:text-accent-foreground",
        collapsed && "justify-center px-0",
      )}
    >
      <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      {collapsed ? <span className="sr-only">{label}</span> : label}
      {active && !collapsed ? (
        <span className="ml-auto size-1.5 rounded-full bg-accent-foreground" aria-hidden="true" />
      ) : null}
    </Link>
  );

  return collapsed ? (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  ) : (
    link
  );
}

function AccountMenu({ user }: { user: { name: string; email: string } }) {
  const initials = user.name
    .trim()
    .split(/\s+/u)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          aria-label={`${user.name || "AccStacks Owner"} account menu`}
          className="gap-1 rounded-full px-1.5"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
            {initials || "AS"}
          </span>
          <ChevronDown className="hidden text-muted-foreground sm:block" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <span className="block text-foreground">{user.name}</span>
          <span className="block truncate">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut({ callbackUrl: "/login" })}>
          <LogOut aria-hidden="true" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Sidebar({
  collapsed = false,
  version,
  onNavigate,
}: {
  collapsed?: boolean;
  version: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div
        className={cn("flex h-14 shrink-0 items-center px-4", collapsed && "justify-center p-0")}
      >
        <WorkspaceBrand collapsed={collapsed} onClick={onNavigate} />
      </div>
      <nav
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2.5 py-3"
        aria-label="Primary navigation"
      >
        {navigation.map(({ label, links }) => (
          <div className="mb-4 space-y-1" key={label}>
            <p
              className={cn(
                "px-2.5 pb-1 font-mono text-[11px] font-medium tracking-wide text-muted-foreground uppercase",
                collapsed && "sr-only",
              )}
            >
              {label}
            </p>
            {links.map((item) => (
              <NavigationLink
                key={item.href}
                {...item}
                collapsed={collapsed}
                onClick={onNavigate}
              />
            ))}
          </div>
        ))}
        <div className="mt-auto pt-4">
          <NavigationLink
            href="/settings"
            label="Settings"
            icon={Settings}
            collapsed={collapsed}
            onClick={onNavigate}
          />
        </div>
      </nav>
      <div className={cn("border-t px-2.5 py-2", collapsed && "flex justify-center")}>
        <ThemeSwitcher collapsed={collapsed} />
        {!collapsed ? (
          <p className="px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground">v{version}</p>
        ) : null}
      </div>
    </>
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
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <div className="flex min-h-svh bg-background">
        <a
          href="#workspace-content"
          className="sr-only z-50 rounded-md bg-card px-4 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Skip to content
        </a>
        <aside
          className={cn(
            "sticky top-0 hidden h-svh shrink-0 flex-col border-r bg-card lg:flex",
            collapsed ? "w-16" : "w-52",
          )}
        >
          <Sidebar collapsed={collapsed} version={version} />
        </aside>
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-card px-4 md:px-6">
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open navigation"
              >
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <div className="lg:hidden">
              <WorkspaceBrand />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="hidden text-muted-foreground lg:inline-flex"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <PanelLeftOpen aria-hidden="true" />
              ) : (
                <PanelLeftClose aria-hidden="true" />
              )}
            </Button>
            <div className="ml-auto flex items-center gap-2 md:gap-3">
              <GlobalSearch />
              <AccountMenu user={user} />
            </div>
          </header>
          <main
            id="workspace-content"
            tabIndex={-1}
            className="mx-auto w-full max-w-[96rem] scroll-mt-14 px-4 py-5 outline-none sm:px-6 lg:px-7 lg:py-6"
          >
            {children}
          </main>
        </div>
      </div>
      <SheetContent side="left" className="w-[min(85vw,18rem)] gap-0 p-0 lg:hidden">
        <SheetTitle className="sr-only">Application navigation</SheetTitle>
        <SheetDescription className="sr-only">Navigate between AccStacks modules</SheetDescription>
        <Sidebar version={version} onNavigate={() => setMobileOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
