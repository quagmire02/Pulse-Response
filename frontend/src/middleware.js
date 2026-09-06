import { NextResponse } from "next/server";
import {
  getTokenExpiryFromSession,
} from "@/libs/cookie";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiRoute,
  authRoute,
  publicRoutes,
} from "./route";

export async function middleware(req) {
  console.warn("Middleware triggered");
  const { pathname } = req.nextUrl;

  const isApiRoute = pathname.startsWith(apiRoute);
  const isAuthRoute = pathname.startsWith(authRoute);

  if (isApiRoute) {
    console.warn("Handling API route");
    return undefined; // Allow access to API routes
  }

  let isLoggedIn = await getTokenExpiryFromSession();

  if (isAuthRoute) {
    console.warn("Handling auth route");
    if (isLoggedIn) {
      console.warn("User is logged in, redirecting to home page");
      // Avoid redirect loop if already at the login page
      if (pathname === DEFAULT_LOGIN_REDIRECT) {
        console.warn("Skipping middleware for DEFAULT_LOGIN_REDIRECT");
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, req.url)); // Redirect to homepage or dashboard
    }
    return NextResponse.next(); // Allow access to login/register if not logged in
  }

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Signed in visitors have no reason to sit on the marketing page.
  if (isPublicRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, req.url));
    }
    return NextResponse.next();
  }

  // Send visitors to the public landing page, not straight at a login form.
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/welcome", req.url));
  }

  const res = NextResponse.next();

  // If everything is fine, allow the request to continue
  return res;
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    "/",
  ],
};
