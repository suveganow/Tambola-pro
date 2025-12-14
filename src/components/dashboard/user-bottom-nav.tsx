"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Ticket, Trophy, History } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Browse", href: "/dashboard/browse" },
  { icon: Ticket, label: "Tickets", href: "/dashboard/games" },
  { icon: History, label: "History", href: "/dashboard/history" },
];

export function UserBottomNav() {
  const pathname = usePathname();

  // Don't show on play pages (immersive experience)
  if (pathname.includes("/play/")) {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full text-xs transition-colors",
                isActive
                  ? "text-purple-600"
                  : "text-gray-500 hover:text-purple-600"
              )}
            >
              <Icon className={cn("h-5 w-5 mb-1", isActive && "text-purple-600")} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
