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
    return undefined;
  }

  let isLoggedIn = await getTokenExpiryFromSession();

  if (isAuthRoute) {
    console.warn("Handling auth route");
    if (isLoggedIn) {
      console.warn("User is logged in, redirecting to home page");

      if (pathname === DEFAULT_LOGIN_REDIRECT) {
        console.warn("Skipping middleware for DEFAULT_LOGIN_REDIRECT");
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, req.url));
    }
    return NextResponse.next();
  }

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  if (isPublicRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, req.url));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/welcome", req.url));
  }

  const res = NextResponse.next();

  return res;
}

export const config = {
  matcher: [

    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",

    "/(api|trpc)(.*)",
    "/",
  ],
};
