"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { UserMobileNav } from "@/components/dashboard/user-mobile-nav";
import { LayoutDashboard, Ticket, Trophy, History, Star } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function DashboardHeader() {
  const { user } = useUser();
  const pathname = usePathname();

  const navItems = [
    { icon: LayoutDashboard, label: "Browse Games", href: "/dashboard/browse" },
    { icon: Ticket, label: "My Tickets", href: "/dashboard/games" },
    { icon: Trophy, label: "Profile", href: "/dashboard" },
    { icon: History, label: "History", href: "/dashboard/history" },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="container mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-8">
          {/* Mobile Menu */}
          <UserMobileNav />

          <Link href="/dashboard" className="text-lg sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
            Tambola Pro
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-4 lg:space-x-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "font-medium flex items-center text-sm lg:text-base transition-colors",
                    isActive ? "text-purple-600" : "text-gray-600 hover:text-purple-600"
                  )}
                >
                  <Icon className="w-4 h-4 mr-1.5 lg:mr-2" /> {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:block text-xs sm:text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            <span className="mr-1">Available XP:</span>
            <span className="font-bold text-purple-600">1,250 XP</span>
          </div>

          {/* Custom Profile Icon linking to Profile Page */}
          <Link href="/dashboard" className="relative group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-purple-100 group-hover:border-purple-300 transition-all">
              <img
                src={user?.imageUrl || "https://www.gravatar.com/avatar?d=mp"}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
