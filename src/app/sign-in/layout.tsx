"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { envConfig } from "@/lib/envConfig";

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider publishableKey={envConfig.CLERK_PUBLISHABLE_KEY}>
      {children}
    </ClerkProvider>
  );
}
