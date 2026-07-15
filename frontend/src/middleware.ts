import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("accessToken")?.value;
  
  const { pathname } = request.nextUrl;
  
  // Define protected routes and prefixes
  const protectedPaths = ["/dashboard", "/profile", "/history", "/settings", "/onboarding", "/curriculum", "/langganan"];
  const protectedPrefixes = ["/arena/", "/admin"];
  
  const isProtected = protectedPaths.includes(pathname) || protectedPrefixes.some(prefix => pathname.startsWith(prefix));

  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    // Optionally preserve the intended destination
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If trying to access auth pages while already logged in
  const authPaths = ["/login", "/register", "/forgot-password", "/reset-password"];
  if (authPaths.includes(pathname) && token) {
    // Assuming they have completed onboarding, or they can be redirected and client-side will handle it.
    // Dashboard is a safe default for logged in users
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Matcher allows us to filter which paths the middleware runs on.
  // We can just run it on everything except static assets and API routes.
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
