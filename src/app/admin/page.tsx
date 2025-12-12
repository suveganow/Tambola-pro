"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { toast } from "sonner";
import { AdminGoogleSSO } from "@/components/auth/AdminGoogleSSO";

export default function AdminAuthPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAndGrantAdminAccess = async () => {
      if (isLoaded) {
        if (!user) {
          setChecking(false);
        } else {
          try {
            // First check if user is already an admin
            const { data } = await axios.get("/api/auth/verify-role");
            if (data.role === "admin") {
              router.push("/admin/dashboard");
            } else {
              // User is logged in but not admin - auto-upgrade to admin
              setUpgrading(true);
              try {
                await axios.post("/api/auth/set-role", {
                  role: "admin",
                  autoGrant: true // Flag to indicate auto-grant (no secret key needed)
                });
                toast.success("Admin access granted!");
                router.push("/admin/dashboard");
              } catch (upgradeError: any) {
                console.error("Auto-upgrade error:", upgradeError);
                setError(upgradeError.response?.data?.error || "Failed to grant admin access");
                setUpgrading(false);
                setChecking(false);
              }
            }
          } catch (error) {
            console.error("Role check error:", error);
            // If role check fails, try to grant admin access anyway
            setUpgrading(true);
            try {
              await axios.post("/api/auth/set-role", {
                role: "admin",
                autoGrant: true
              });
              toast.success("Admin access granted!");
              router.push("/admin/dashboard");
            } catch (upgradeError: any) {
              console.error("Auto-upgrade error:", upgradeError);
              setError(upgradeError.response?.data?.error || "Failed to grant admin access");
              setUpgrading(false);
              setChecking(false);
            }
          }
        }
      }
    };

    checkAndGrantAdminAccess();
  }, [isLoaded, user, router]);

  if (!isLoaded || checking || upgrading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-white">
            {upgrading ? "Granting admin access..." : "Checking authentication..."}
          </p>
        </div>
      </div>
    );
  }

  // Error state - show error and sign out option
  if (error && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 p-4">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-white/20">
          <div className="text-center mb-6">
            <ShieldCheck className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Access Error</h1>
            <p className="text-red-400 text-sm">{error}</p>
          </div>

          <div className="bg-white/5 p-4 rounded-lg text-center mb-6">
            <p className="text-gray-300 text-sm">Signed in as:</p>
            <p className="font-semibold text-white">{user.primaryEmailAddress?.emailAddress}</p>
          </div>

          <Button
            variant="ghost"
            onClick={() => signOut()}
            className="w-full text-gray-400 hover:text-white hover:bg-white/10"
          >
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  // Not logged in - show Google SSO
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-white/20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/20 rounded-full mb-4">
              <ShieldCheck className="h-8 w-8 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
            <p className="text-gray-300">Sign in to access admin dashboard</p>
          </div>

          <AdminGoogleSSO mode="signIn" />
        </div>
      </div>
    </div>
  );
}


