"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "📊" },
  { label: "Profile", href: "/profile", icon: "👤" },
  { label: "History", href: "/history", icon: "🕒" },
  { label: "Langganan", href: "/langganan", icon: "💳" },
  { label: "Settings", href: "/settings", icon: "⚙️" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Do not show sidebar on onboarding page to keep it clean
  if (pathname === "/onboarding") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 flex flex-col">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Sidebar for Desktop, Topbar for Mobile */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-background/50 flex flex-col justify-between">
        <div className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-6 md:mb-10 px-2">
            <div className="h-6 w-6 rounded bg-primary" />
            <span className="font-bold text-lg tracking-tight">Kodeye</span>
          </div>

          <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                    isActive
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 md:p-6 hidden md:block border-t border-border mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <span className="text-base">🚪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-[calc(100vh-73px)] md:h-screen overflow-y-auto">
        {children}
      </main>

      {/* Mobile Logout Button (optional, can be placed elsewhere) */}
      <div className="md:hidden p-4 border-t border-border bg-background flex justify-center">
         <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-3 py-2 w-full rounded-md text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors"
          >
            🚪 Logout
          </button>
      </div>
    </div>
  );
}
