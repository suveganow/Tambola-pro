'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';

export default function SSOCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto mb-4" />
        <p className="text-white text-lg">Completing authentication...</p>
        <p className="text-gray-400 text-sm mt-2">Please wait while we verify your account</p>
      </div>
      <AuthenticateWithRedirectCallback
        afterSignInUrl="/admin"
        afterSignUpUrl="/admin"
      />
    </div>
  );
}
