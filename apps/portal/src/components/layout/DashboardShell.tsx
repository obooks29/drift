"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Bot, ScrollText, ShieldCheck, Settings, Zap, LogOut, Menu, ChevronRight } from "lucide-react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { cn } from "@/lib/utils";
import { useState } from "react";

const NAV = [
  { label: "Overview",  href: "/",         icon: LayoutDashboard },
  { label: "Agents",    href: "/agents",    icon: Bot },
  { label: "Ledger",    href: "/ledger",    icon: ScrollText },
  { label: "Consent",   href: "/consent",   icon: ShieldCheck },
  { label: "Apex",      href: "/apex",      icon: Zap },
  { label: "Settings",  href: "/settings",  icon: Settings },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#080812]">
      <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-64 flex-col transition-transform duration-200 lg:relative lg:translate-x-0", mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
        <div className="flex h-full flex-col border-r border-white/[0.06] bg-[#0C0C1E]">
          <div className="flex h-16 shrink-0 items-center gap-3 px-6 border-b border-white/[0.06]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-drift-500/20 ring-1 ring-drift-500/30">
              <Zap className="h-4 w-4 text-drift-400" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">Drift</span>
            <span className="ml-auto text-[10px] font-medium text-drift-400 bg-drift-500/10 rounded-md px-2 py-0.5 ring-1 ring-drift-500/20">BETA</span>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
            {NAV.map(({ label, href, icon: Icon }) => {
              const active = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link key={href} href={href} className={cn("group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150", active ? "bg-drift-500/15 text-drift-300 ring-1 ring-drift-500/20" : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]")}>
                  <Icon className={cn("h-4 w-4 shrink-0", active ? "text-drift-400" : "text-white/40 group-hover:text-white/60")} />
                  {label}
                  {active && <ChevronRight className="ml-auto h-3 w-3 text-drift-400/60" />}
                </Link>
              );
            })}
          </nav>
          <div className="mx-3 mb-3 rounded-xl bg-emerald-950/30 p-3 ring-1 ring-emerald-500/15">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
                <Zap className="h-3.5 w-3.5 text-emerald-400" />
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#0C0C1E] animate-pulse-soft" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-emerald-300">Apex</p>
                <p className="text-[10px] text-emerald-500/80">Meta-agent · Active</p>
              </div>
            </div>
          </div>
          {user && (
            <div className="border-t border-white/[0.06] p-3">
              <div className="flex items-center gap-3 rounded-lg px-2 py-2">
                {user.picture && <img src={user.picture} alt="" className="h-7 w-7 rounded-full ring-1 ring-white/10" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-white/80">{user.name}</p>
                  <p className="truncate text-[10px] text-white/40">{user.email}</p>
                </div>
                <Link href="/api/auth/logout" className="text-white/30 hover:text-white/70 transition-colors">
                  <LogOut className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </aside>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex h-16 shrink-0 items-center gap-4 border-b border-white/[0.06] px-4 lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="text-white/60 hover:text-white"><Menu className="h-5 w-5" /></button>
          <span className="font-semibold text-white">Drift</span>
        </div>
        <main className="flex-1 overflow-y-auto scrollbar-thin">{children}</main>
      </div>
    </div>
  );
}
