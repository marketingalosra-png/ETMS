"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  ClipboardList,
  Command,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Users
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn, initials } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const adminNav: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/employees", label: "Employees", icon: Users },
  { href: "/admin/trainings", label: "Trainings", icon: BookOpen },
  { href: "/admin/assignments", label: "Assignments", icon: ClipboardList },
  { href: "/admin/completed-trainings", label: "Completed Trainings", icon: ShieldCheck },
  { href: "/admin/settings", label: "Settings", icon: Settings }
];

const employeeNav: NavItem[] = [
  { href: "/employee/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employee/trainings", label: "My Trainings", icon: GraduationCap },
  { href: "/employee/settings", label: "Settings", icon: Settings }
];

export function DashboardShell({ children, role }: { children: ReactNode; role: "ADMIN" | "EMPLOYEE" }) {
  const pathname = usePathname();
  const { data } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const nav = role === "ADMIN" ? adminNav : employeeNav;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const activeTitle = useMemo(() => nav.find((item) => pathname.startsWith(item.href))?.label ?? "Workspace", [nav, pathname]);

  return (
    <div className="min-h-screen">
      <div className="premium-grid pointer-events-none fixed inset-x-0 top-0 h-64 opacity-60" />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r bg-card/72 backdrop-blur-xl transition-all duration-300 lg:block",
          collapsed ? "w-20" : "w-72"
        )}
      >
        <SidebarContent nav={nav} pathname={pathname} collapsed={collapsed} onCollapse={() => setCollapsed((value) => !value)} />
      </aside>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="absolute inset-0 bg-slate-950/45" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />
            <motion.aside className="relative h-full w-80 border-r bg-card p-3" initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }}>
              <SidebarContent nav={nav} pathname={pathname} collapsed={false} onCollapse={() => setMobileOpen(false)} />
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className={cn("relative transition-all duration-300", collapsed ? "lg:pl-20" : "lg:pl-72")}>
        <header className="sticky top-0 z-30 border-b bg-background/72 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Button variant="ghost" className="h-10 w-10 px-0 lg:hidden" onClick={() => setMobileOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">ETMS Workspace</p>
                <h1 className="truncate text-lg font-semibold">{activeTitle}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" className="hidden min-w-64 justify-start text-muted-foreground md:inline-flex" onClick={() => setPaletteOpen(true)}>
                <Search className="h-4 w-4" />
                Search everything
                <kbd className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px]">Ctrl K</kbd>
              </Button>
              <ThemeToggle />
              <div className="hidden items-center gap-3 rounded-lg border bg-card/70 px-2 py-1.5 sm:flex">
                <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                  {initials(data?.user?.name)}
                </div>
                <div className="max-w-36">
                  <p className="truncate text-sm font-semibold">{data?.user?.name ?? "User"}</p>
                  <p className="text-xs text-muted-foreground">{role === "ADMIN" ? "Admin" : data?.user?.employeeId}</p>
                </div>
              </div>
              <Button variant="ghost" className="h-10 w-10 px-0" title="Sign out" onClick={() => signOut({ callbackUrl: "/login" })}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} nav={nav} />
    </div>
  );
}

function SidebarContent({ nav, pathname, collapsed, onCollapse }: { nav: NavItem[]; pathname: string; collapsed: boolean; onCollapse: () => void }) {
  return (
    <div className="flex h-full flex-col p-3">
      <div className="mb-5 flex items-center justify-between gap-2 px-2 py-2">
        <Link href="/launch" className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-glow">
            <BarChart3 className="h-5 w-5" />
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">ETMS</p>
              <p className="truncate text-xs text-muted-foreground">Training operations</p>
            </div>
          ) : null}
        </Link>
        <Button variant="ghost" className="hidden h-9 w-9 px-0 lg:inline-flex" onClick={onCollapse}>
          <ChevronLeft className={cn("h-4 w-4 transition", collapsed && "rotate-180")} />
        </Button>
      </div>
      <nav className="space-y-1">
        {nav.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition",
                active ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed ? <span className="truncate">{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-xl border bg-muted/40 p-3">
        {!collapsed ? (
          <>
            <p className="text-sm font-semibold">Compliance pulse</p>
            <p className="mt-1 text-xs text-muted-foreground">Real-time learning status across teams.</p>
            <div className="mt-3 h-2 rounded-full bg-background">
              <div className="h-full w-3/4 rounded-full bg-accent" />
            </div>
          </>
        ) : (
          <ShieldCheck className="mx-auto h-5 w-5 text-accent" />
        )}
      </div>
    </div>
  );
}

function CommandPalette({ open, onClose, nav }: { open: boolean; onClose: () => void; nav: NavItem[] }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-50 grid place-items-start bg-slate-950/45 px-4 pt-24" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button className="absolute inset-0" onClick={onClose} aria-label="Close command palette" />
          <motion.div className="glass relative mx-auto w-full max-w-2xl overflow-hidden rounded-xl" initial={{ y: -18, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: -18, scale: 0.98 }}>
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <Command className="h-4 w-4 text-muted-foreground" />
              <input autoFocus placeholder="Search employees, trainings, departments..." className="h-10 flex-1 bg-transparent text-sm outline-none" />
            </div>
            <div className="max-h-96 overflow-y-auto p-2">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} onClick={onClose} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-muted">
                  <item.icon className="h-4 w-4 text-primary" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
