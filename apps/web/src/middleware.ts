import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Only auth itself and static PWA assets are public — every app route
// (dashboard, bills, savings, activity, settings, onboarding) requires a
// signed-in Clerk session, since they all read/write the user's own data.
// Clerk webhooks are the one exception among "api" routes: they arrive from
// Clerk itself with a svix signature (verified inside the route handler),
// never a user session, so `auth.protect()` must not run for them.
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",
  "/manifest.webmanifest",
  "/icons(.*)",
  "/sw.js",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
