"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import axios from "axios";

export function UserSyncProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const hasSynced = useRef(false);

  useEffect(() => {
    const syncUser = async () => {
      if (isLoaded && user && !hasSynced.current) {
        hasSynced.current = true;
        try {
          await axios.post("/api/auth/user/register", {
            clerkId: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            firstName: user.firstName || "",
            lastName: user.lastName || "",
          });
        } catch (error) {
          // User might already exist, that's fine
          console.log("User sync completed or already exists");
        }
      }
    };

    syncUser();
  }, [isLoaded, user]);

  return <>{children}</>;
}
