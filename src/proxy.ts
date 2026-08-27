import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Routes anyone can reach without a session: the landing page, the auth
 * screens, the public components showcase, and the Stripe webhook (which is
 * called by Stripe, not a signed-in user). Everything else requires a
 * signed-in user. `/sign-in` and `/sign-up` additionally bounce
 * already-authenticated users to `/dashboard` from their page components, so
 * the guard here is one-directional (block the signed-out from private
 * routes); the pages handle the reverse.
 *
 * Note: admin-only access (`/admin`) is still enforced by its layout via
 * `requireAdmin()`, since role lookups need Prisma and don't belong in the edge
 * proxy.
 */
const isPublicRoute = createRouteMatcher([
	"/",
	"/components",
	"/sign-in(.*)",
	"/sign-up(.*)",
	"/api/stripe/webhook",
]);

export default clerkMiddleware(async (auth, req) => {
	if (!isPublicRoute(req)) {
		await auth.protect();
	}
});

export const config = {
	matcher: [
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		"/(api|trpc)(.*)",
		"/__clerk/(.*)",
	],
};
