"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Home, PlayCircle, FileText, Settings } from "lucide-react";

type MobileLayoutProps = {
  children: ReactNode;
};

/**
 * MobileLayout
 * - Sur desktop (md et +) : rend simplement {children}
 * - Sur mobile : header + bottom nav + conteneur scrollable
 */
export default function MobileLayout({ children }: MobileLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      label: "Home",
      icon: Home,
      href: "/dashboard",
      active: pathname?.startsWith("/dashboard") || pathname === "/",
    },
    {
      label: "Simulation",
      icon: PlayCircle,
      href: "/session/start",
      active: pathname?.startsWith("/session"),
    },
    {
      label: "CV / Offer",
      icon: FileText,
      href: "/dashboard/cv",
      active: pathname?.includes("cv") || pathname?.includes("analyze"),
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/dashboard/settings",
      active: pathname?.includes("settings"),
    },
  ];

  const handleNav = (href: string) => {
    if (href === pathname) return;
    router.push(href);
  };

  return (
    <>
      {/* Desktop / large screens → on ne touche à rien */}
      <div className="hidden md:block h-full w-full">
        {children}
      </div>

      {/* Mobile layout */}
      <div className="md:hidden flex flex-col h-screen bg-black text-white">
        {/* Header */}
        <header className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/10 bg-black/80 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-[0.18em] text-white/60">
              TALENTEE
            </span>
            <span className="text-xs text-white/40">.ai</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/session/start")}
              className="px-3 py-1.5 rounded-full bg-white text-black text-xs font-semibold shadow-sm"
            >
              Start simulation
            </button>
          </div>
        </header>

        {/* Contenu scrollable */}
        <main className="flex-1 overflow-y-auto px-3 pb-20 pt-3">
          {children}
        </main>

        {/* Bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-black/90 backdrop-blur-md z-50">
          <div className="flex items-stretch justify-around py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.active;
              return (
                <button
                  key={item.label}
                  onClick={() => handleNav(item.href)}
                  className="flex flex-col items-center justify-center flex-1 text-[11px] gap-1 text-white/50"
                >
                  <div
                    className={[
                      "flex items-center justify-center w-9 h-9 rounded-full border",
                      isActive
                        ? "bg-white text-black border-white shadow-sm"
                        : "border-white/10 bg-white/5 text-white/70",
                    ].join(" ")}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={
                      isActive
                        ? "text-[11px] font-semibold text-white"
                        : "text-[11px] font-medium text-white/60"
                    }
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}
