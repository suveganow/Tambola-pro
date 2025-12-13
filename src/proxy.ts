import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// User routes - require user authentication
const isUserProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/games(.*)',
  '/play(.*)',
]);

// Admin routes - require admin authentication
const isAdminProtectedRoute = createRouteMatcher([
  '/admin/dashboard(.*)',
  '/admin/games(.*)',
  '/admin/players(.*)',
]);

// User auth routes
const isUserAuthRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-callback(.*)',
]);

// Admin auth route (main /admin page handles auth inline)
const isAdminAuthRoute = createRouteMatcher([
  '/admin',
  '/admin/sso-callback(.*)',
]);

// Public routes that don't require any authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/api/webhooks(.*)',
  '/api/auth(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const pathname = req.nextUrl.pathname;

  // 1. Public Routes: Allow access
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // 2. User Auth Routes (sign-in, sso-callback)
  if (isUserAuthRoute(req)) {
    // If already authenticated as user, redirect to dashboard
    if (userId) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  // 3. Admin Auth Route (/admin page - handles auth inline)
  if (isAdminAuthRoute(req)) {
    // If already authenticated, check role and redirect if admin
    // Note: Role check happens on the page itself for redirection
    return NextResponse.next();
  }

  // 4. User Protected Routes
  if (isUserProtectedRoute(req)) {
    if (!userId) {
      // Not authenticated - redirect to user sign-in
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }
    // User is authenticated with user Clerk instance - allow access
    return NextResponse.next();
  }

  // 5. Admin Protected Routes
  if (isAdminProtectedRoute(req)) {
    if (!userId) {
      // Not authenticated - redirect to admin page (handles auth inline)
      return NextResponse.redirect(new URL('/admin', req.url));
    }
    // Admin is authenticated with admin Clerk instance - allow access
    return NextResponse.next();
  }

  // 6. Default: Block access to unrecognized routes for unauthenticated users
  if (!userId) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
