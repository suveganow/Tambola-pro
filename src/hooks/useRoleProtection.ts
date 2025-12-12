"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import axios from "@/lib/axios-client";
import { toast } from "sonner";

type Role = "admin" | "user";

interface UseRoleProtectionOptions {
  allowedRole: Role;
  redirectTo: string;
}

interface RoleProtectionState {
  isAuthorized: boolean | null;
  isLoading: boolean;
  userRole: Role | null;
}

/**
 * Hook to protect routes based on user role.
 * Redirects unauthorized users with a toast notification.
 * 
 * @param allowedRole - The role required to access the route
 * @param redirectTo - The path to redirect unauthorized users to
 * @returns Object with isAuthorized, isLoading, and userRole states
 */
export function useRoleProtection({ allowedRole, redirectTo }: UseRoleProtectionOptions): RoleProtectionState {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [state, setState] = useState<RoleProtectionState>({
    isAuthorized: null,
    isLoading: true,
    userRole: null,
  });

  const checkRole = useCallback(async () => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setState({
        isAuthorized: false,
        isLoading: false,
        userRole: null,
      });
      return;
    }

    try {
      const { data } = await axios.get("/api/auth/verify-role");

      if (data.success && data.role === allowedRole) {
        setState({
          isAuthorized: true,
          isLoading: false,
          userRole: data.role,
        });
      } else {
        setState({
          isAuthorized: false,
          isLoading: false,
          userRole: data.role || null,
        });

        const accessType = allowedRole === "admin" ? "administrators" : "users";
        toast.error(`Access denied. This page is only accessible to ${accessType}.`);
        router.replace(redirectTo);
      }
    } catch (error) {
      console.error("Role verification failed:", error);
      setState({
        isAuthorized: false,
        isLoading: false,
        userRole: null,
      });
      toast.error("Failed to verify access permissions. Redirecting...");
      router.replace(redirectTo);
    }
  }, [isLoaded, isSignedIn, allowedRole, redirectTo, router]);

  useEffect(() => {
    checkRole();
  }, [checkRole]);

  return state;
}
