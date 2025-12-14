"use client";

import { ClerkProvider } from "@clerk/nextjs";
import Link from "next/link";
import { LayoutDashboard, Ticket, Trophy, History } from "lucide-react";
import { envConfig } from "@/lib/envConfig";
import { UserBottomNav } from "@/components/dashboard/user-bottom-nav";
import { GameNotificationListener } from "@/components/game/game-notification-listener";
import { UserSyncProvider } from "@/components/providers/user-sync-provider";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

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

        <div className="min-h-screen bg-gray-50 pb-28 md:pb-0">
          {/* Top Navigation */}
          <DashboardHeader />

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
