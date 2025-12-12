"use client";

import { AuthenticateWithRedirectCallback, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function SSOCallbackPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    const registerUser = async () => {
      if (isLoaded && user && !registering) {
        setRegistering(true);
        try {
          // Register user in database
          await axios.post("/api/auth/user/register", {
            clerkId: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            firstName: user.firstName || "",
            lastName: user.lastName || "",
          });
          console.log("User registered in database");
        } catch (error) {
          console.error("User registration error:", error);
          // Continue anyway - user might already exist
        }
        // Redirect to dashboard
        router.push("/dashboard/browse");
      }
    };

    registerUser();
  }, [isLoaded, user, router, registering]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      <div className="text-center">
        <div className="mb-6">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">
          Completing sign in...
        </h2>
        <p className="text-purple-200">
          Please wait while we set up your account
        </p>
      </div>
      <AuthenticateWithRedirectCallback
        afterSignInUrl="/dashboard/browse"
        afterSignUpUrl="/dashboard/browse"
      />
    </div>
  );
}
