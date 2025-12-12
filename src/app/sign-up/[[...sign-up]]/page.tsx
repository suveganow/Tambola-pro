"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      <div className="w-full max-w-md p-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🎯 Tambola Pro
          </h1>
          <p className="text-purple-200">
            Create an account to start playing
          </p>
        </div>

        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl",
              headerTitle: "text-white",
              headerSubtitle: "text-purple-200",
              socialButtonsBlockButton: "bg-white hover:bg-gray-100 text-gray-800",
              formButtonPrimary: "bg-purple-600 hover:bg-purple-700",
              footerActionLink: "text-purple-300 hover:text-white",
            },
          }}
          fallbackRedirectUrl="/dashboard/browse"
          signInUrl="/sign-in"
        />
      </div>
    </div>
  );
}
