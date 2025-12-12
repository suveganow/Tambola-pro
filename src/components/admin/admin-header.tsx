"use client";

import { MobileSidebar } from "./mobile-sidebar";
import { UserButton } from "@clerk/nextjs";

export function AdminHeader() {
  return (
    <header className="lg:hidden sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-white px-4 shadow-sm">
      <MobileSidebar />

      <div className="flex-1">
        <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
          Tambola Admin
        </h1>
      </div>

      <UserButton
        afterSignOutUrl="/admin"
        appearance={{
          elements: {
            avatarBox: "h-8 w-8"
          }
        }}
      />
    </header>
  );
}
