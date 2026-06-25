"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getShopProduct, getStripe } from "@/lib/stripe";
import { getCurrentUser, getOrCreateUser } from "@/lib/user";

export type CheckoutResult =
	| { ok: true; url: string }
	| { ok: false; error: string };

async function getOrigin(): Promise<string> {
	const h = await headers();
	const origin = h.get("origin");
	if (origin) return origin;
	const host = h.get("host") ?? "localhost:3000";
	const proto = h.get("x-forwarded-proto") ?? "http";
	return `${proto}://${host}`;
}

export async function createCheckoutSession(
	productId: string,
	recurring = false,
): Promise<CheckoutResult> {
	const user = await getOrCreateUser();
	if (!user) return { ok: false, error: "You must be signed in to buy." };

	const product = getShopProduct(productId);
	if (!product) return { ok: false, error: "Unknown product." };

	const useRecurring = recurring && !!product.recurring;
	const priceId = useRecurring ? product.recurring?.priceId : product.priceId;
	const mode = useRecurring ? "subscription" : product.mode;
	if (!priceId) {
		return {
			ok: false,
			error: `${product.name} is not available yet (no Stripe price configured).`,
		};
	}

	try {
		const stripe = getStripe();
		const origin = await getOrigin();

		const metadata = {
			userId: user.id,
			clerkId: user.clerkId,
			productId: product.id,
		};

		const session = await stripe.checkout.sessions.create({
			mode,
			line_items: [{ price: priceId, quantity: 1 }],
			customer_email: user.email || undefined,
			success_url: `${origin}/shop?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${origin}/shop?checkout=cancelled`,
			metadata,
			...(mode === "subscription"
				? { subscription_data: { metadata } }
				: {}),
		});

		if (!session.url) {
			return { ok: false, error: "Stripe did not return a checkout URL." };
		}
		return { ok: true, url: session.url };
	} catch (err) {
		console.error("[shop] checkout error:", err);
		return { ok: false, error: "Could not start checkout. Try again." };
	}
}

export type ConfirmResult =
	| { status: "fulfilled" }
	| { status: "pending" }
	| { status: "unpaid" }
	| { status: "error" };

export async function confirmCheckout(
	sessionId: string,
): Promise<ConfirmResult> {
	const user = await getCurrentUser();
	if (!user) return { status: "error" };

	try {
		const session = await getStripe().checkout.sessions.retrieve(sessionId);
		if (session.metadata?.userId !== user.id) return { status: "error" };
		if (session.payment_status !== "paid") return { status: "unpaid" };

		const fulfilled = await prisma.processedStripeEvent.findUnique({
			where: { id: sessionId },
		});
		return fulfilled ? { status: "fulfilled" } : { status: "pending" };
	} catch (err) {
		console.error("[shop] confirm error:", err);
		return { status: "error" };
	}
}
