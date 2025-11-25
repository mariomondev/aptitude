import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Constants
const APP_NAME = "aptitude-ucat-style-test";

// Define protected routes in an array for easy management
const PROTECTED_ROUTES = ["/dashboard"];

// Helper function to check if a path is protected
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: APP_NAME,
  });

  // Check if user is authenticated and redirect to dashboard
  if (request.nextUrl.pathname === "/" && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Check if current route is protected and if user is not authenticated
  if (isProtectedRoute(request.nextUrl.pathname) && !sessionCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Exclude API routes, static files, image optimizations, and .png files
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
