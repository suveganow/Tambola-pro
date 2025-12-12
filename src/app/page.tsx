"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, ClerkProvider, SignedIn, SignedOut, SignIn } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Trophy, Users, Shield, Loader2, X } from "lucide-react";
import Link from "next/link";
import { envConfig } from "@/lib/envConfig";

function LandingPageContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [showSignIn, setShowSignIn] = useState(false);

  // Auto-redirect signed-in users to dashboard
  useEffect(() => {
    if (isLoaded && user) {
      router.push("/dashboard/browse");
    } else if (isLoaded) {
      setChecking(false);
    }
  }, [isLoaded, user, router]);

  // Show loading state while checking authentication
  if (!isLoaded || checking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Sign In Modal */}
      {showSignIn && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="relative">
            <button 
              onClick={() => setShowSignIn(false)}
              className="absolute -top-2 -right-2 z-10 bg-white rounded-full p-1 shadow-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
            <SignIn 
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "shadow-2xl border border-gray-200 rounded-2xl"
                }
              }}
              fallbackRedirectUrl="/dashboard/browse"
            />
          </div>
        </div>
      )}

      {/* Hero Section */}
      <header className="px-4 lg:px-6 h-16 flex items-center justify-between border-b bg-white/50 backdrop-blur-sm fixed w-full z-50">
        <div className="flex items-center gap-2 font-bold text-2xl text-purple-700">
          <Trophy className="h-6 w-6" />
          Tambola Pro
        </div>
        <nav className="flex gap-4">
          <SignedOut>
            <Button 
              onClick={() => setShowSignIn(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Sign In with Google
            </Button>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard">
              <Button className="bg-purple-600 hover:bg-purple-700">
                Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </SignedIn>
        </nav>
      </header>

      <main className="pt-24 pb-16">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center text-center space-y-8 mb-16">
            <div className="space-y-4 max-w-3xl">
              <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
                The Ultimate Tambola Experience
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                Play classic Indian Bingo with friends and family online. Real-time numbers, voice announcements, and instant prizes.
              </p>
            </div>

            <SignedOut>
              <Button 
                size="lg" 
                onClick={() => setShowSignIn(true)}
                className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-6 h-auto"
              >
                Start Playing Now
              </Button>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard/browse">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-6 h-auto">
                  Browse Games
                </Button>
              </Link>
            </SignedIn>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border-none shadow-lg bg-white/80 backdrop-blur">
              <CardHeader>
                <Users className="h-10 w-10 text-blue-500 mb-2" />
                <CardTitle>Multiplayer Fun</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Connect with hundreds of players in real-time. Host private games or join public rooms.
                </p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg bg-white/80 backdrop-blur">
              <CardHeader>
                <Trophy className="h-10 w-10 text-yellow-500 mb-2" />
                <CardTitle>Instant Wins</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Automated winner detection for Early 5, Lines, and Full House. No more manual checking!
                </p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg bg-white/80 backdrop-blur">
              <CardHeader>
                <Shield className="h-10 w-10 text-green-500 mb-2" />
                <CardTitle>Fair Play</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Secure random number generation and anti-cheat systems ensure a fair game for everyone.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-gray-400 text-sm border-t">
        © 2024 Tambola Pro. All rights reserved.
      </footer>
    </div>
  );
}

export default function LandingPage() {
  return (
    <ClerkProvider publishableKey={envConfig.CLERK_PUBLISHABLE_KEY}>
      <LandingPageContent />
    </ClerkProvider>
  );
}

