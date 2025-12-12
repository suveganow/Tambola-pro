"use client";

import { UserButton, ClerkProvider } from "@clerk/nextjs";
import Link from "next/link";
import { LayoutDashboard, Ticket, Trophy, History } from "lucide-react";
import { envConfig } from "@/lib/envConfig";
import { UserMobileNav } from "@/components/dashboard/user-mobile-nav";
import { UserBottomNav } from "@/components/dashboard/user-bottom-nav";
import { GameNotificationListener } from "@/components/game/game-notification-listener";
import { UserSyncProvider } from "@/components/providers/user-sync-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider publishableKey={envConfig.CLERK_PUBLISHABLE_KEY}>
      {/* User Sync Provider - Ensures user is registered in database */}
      <UserSyncProvider>
        {/* Game Notification Listener - Always active */}
        <GameNotificationListener />

        <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
          {/* Top Navigation */}
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
                  <Link href="/dashboard/browse" className="text-gray-600 hover:text-purple-600 font-medium flex items-center text-sm lg:text-base">
                    <LayoutDashboard className="w-4 h-4 mr-1.5 lg:mr-2" /> Browse Games
                  </Link>
                  <Link href="/dashboard/games" className="text-gray-600 hover:text-purple-600 font-medium flex items-center text-sm lg:text-base">
                    <Ticket className="w-4 h-4 mr-1.5 lg:mr-2" /> My Tickets
                  </Link>
                  <Link href="/dashboard" className="text-gray-600 hover:text-purple-600 font-medium flex items-center text-sm lg:text-base">
                    <Trophy className="w-4 h-4 mr-1.5 lg:mr-2" /> Profile
                  </Link>
                  <Link href="/dashboard/history" className="text-gray-600 hover:text-purple-600 font-medium flex items-center text-sm lg:text-base">
                    <History className="w-4 h-4 mr-1.5 lg:mr-2" /> History
                  </Link>
                </nav>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden sm:block text-xs sm:text-sm text-gray-500">
                  Balance: <span className="font-bold text-green-600">₹1,250</span>
                </div>
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
            {children}
          </main>

          {/* Mobile Bottom Navigation */}
          <UserBottomNav />
        </div>
      </UserSyncProvider>
    </ClerkProvider>
  );
}
