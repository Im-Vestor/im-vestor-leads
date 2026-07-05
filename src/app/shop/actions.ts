"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
	findActivePokeSubscription,
	getShopProduct,
	getStripe,
	PRODUCT_GRANTS,
} from "@/lib/stripe";
import {
	getCurrentUser,
	getOrCreateStripeCustomerId,
	getOrCreateUser,
} from "@/lib/user";

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
	if (!priceId) {
		return {
			ok: false,
			error: `${product.name} is not available yet (no Stripe price configured).`,
		};
	}

	try {
		const stripe = getStripe();
		const origin = await getOrigin();

		if (
			useRecurring &&
			product.category === "pokes" &&
			user.stripeCustomerId &&
			(await findActivePokeSubscription(user.stripeCustomerId))
		) {
			return {
				ok: false,
				error:
					"You already have an active poke plan. Use Switch to change plans instead.",
			};
		}

		const customer = await getOrCreateStripeCustomerId(user);

		const price = await stripe.prices.retrieve(priceId);
		const mode = price.recurring ? "subscription" : "payment";

		const metadata = {
			userId: user.id,
			clerkId: user.clerkId,
			productId: product.id,
		};

		const session = await stripe.checkout.sessions.create({
			mode,
			line_items: [{ price: priceId, quantity: 1 }],
			customer,
			success_url: `${origin}/shop?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${origin}/shop?checkout=cancelled`,
			metadata,
			...(mode === "subscription" ? { subscription_data: { metadata } } : {}),
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

export type PlanChangeResult = { ok: true } | { ok: false; error: string };

export async function changePokePlan(
	targetProductId: string,
): Promise<PlanChangeResult> {
	const user = await getCurrentUser();
	if (!user?.stripeCustomerId) {
		return { ok: false, error: "You don't have an active poke plan." };
	}

	const target = getShopProduct(targetProductId);
	if (!target) return { ok: false, error: "Invalid target plan." };
	if (
		target.category !== "pokes" ||
		!target.recurring?.priceId ||
		!PRODUCT_GRANTS[targetProductId]
	) {
		return { ok: false, error: "Invalid target plan." };
	}

	try {
		const stripe = getStripe();
		const sub = await findActivePokeSubscription(user.stripeCustomerId);
		if (!sub)
			return { ok: false, error: "You don't have an active poke plan." };

		const currentProductId = sub.metadata?.productId;
		if (currentProductId === targetProductId) {
			return { ok: false, error: "That's already your current plan." };
		}

		const currentPokes = currentProductId
			? (PRODUCT_GRANTS[currentProductId]?.pokes ?? 0)
			: 0;
		const targetPokes = PRODUCT_GRANTS[targetProductId]?.pokes ?? 0;
		const cycleHigh = Math.max(user.pokeCycleHigh, currentPokes);
		const creditDelta = Math.max(0, targetPokes - cycleHigh);

		const itemId = sub.items.data[0]?.id;
		if (!itemId) {
			return { ok: false, error: "Could not read your subscription." };
		}

		const updated = await stripe.subscriptions.update(sub.id, {
			items: [{ id: itemId, price: target.recurring.priceId }],
			proration_behavior: creditDelta > 0 ? "always_invoice" : "none",
			metadata: { ...sub.metadata, productId: targetProductId },
			expand: ["latest_invoice"],
		});

		if (creditDelta > 0) {
			const invoice =
				updated.latest_invoice && typeof updated.latest_invoice === "object"
					? updated.latest_invoice
					: null;
			if (invoice?.id && invoice.status === "paid") {
				try {
					await prisma.$transaction([
						prisma.processedStripeEvent.create({
							data: { id: invoice.id, type: "poke_upgrade" },
						}),
						prisma.user.updateMany({
							where: { id: user.id },
							data: {
								pokes: { increment: creditDelta },
								pokeCycleHigh: targetPokes,
							},
						}),
					]);
				} catch (err) {
					if ((err as { code?: string })?.code !== "P2002") throw err;
				}
			}
		} else if (cycleHigh > user.pokeCycleHigh) {
			await prisma.user.updateMany({
				where: { id: user.id },
				data: { pokeCycleHigh: cycleHigh },
			});
		}

		return { ok: true };
	} catch (err) {
		console.error("[shop] change plan error:", err);
		return { ok: false, error: "Could not change your plan. Try again." };
	}
}
