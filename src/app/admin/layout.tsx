"use client";

import { usePathname } from "next/navigation";
import { ClerkProvider } from "@clerk/nextjs";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { envConfig } from "@/lib/envConfig";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Don't show sidebar on the auth page (/admin)
  const isAuthPage = pathname === "/admin";

  if (isAuthPage) {
    return <ClerkProvider>{children}</ClerkProvider>;
  }

  return (
    <ClerkProvider publishableKey={envConfig.CLERK_ADMIN_PUBLISHABLE_KEY}>
      <div className="flex min-h-screen bg-gray-100">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden lg:block">
          <AdminSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header - hidden on desktop */}
          <AdminHeader />

          <main className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ClerkProvider>
  );
}



