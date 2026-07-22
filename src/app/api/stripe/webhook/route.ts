import type Stripe from "stripe";
import { env } from "@/env";
import { prisma } from "@/lib/prisma";
import { getStripe, PRODUCT_GRANTS } from "@/lib/stripe";
import {
	stripeCustomerId as customerId,
	fulfillPaidCheckoutSession,
} from "@/lib/stripe-fulfill";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isDuplicateEventError(err: unknown): boolean {
	return (err as { code?: string })?.code === "P2002";
}

export async function POST(request: Request) {
	if (!env.STRIPE_WEBHOOK_SECRET) {
		return new Response("Webhook secret not configured", { status: 500 });
	}

	const signature = request.headers.get("stripe-signature");
	if (!signature) {
		return new Response("Missing stripe-signature header", { status: 400 });
	}

	let event: Stripe.Event;
	try {
		const body = await request.text();
		event = getStripe().webhooks.constructEvent(
			body,
			signature,
			env.STRIPE_WEBHOOK_SECRET,
		);
	} catch (err) {
		console.error("[stripe webhook] signature verification failed:", err);
		return new Response("Invalid signature", { status: 400 });
	}

	try {
		await handleEvent(event);
	} catch (err) {
		if (isDuplicateEventError(err)) {
			return Response.json({ received: true, duplicate: true });
		}
		console.error("[stripe webhook] handler error:", event.type, err);
		return new Response("Handler error", { status: 500 });
	}

	return Response.json({ received: true });
}

async function handleEvent(event: Stripe.Event): Promise<void> {
	switch (event.type) {
		case "checkout.session.completed":
			return fulfillCheckout(event);
		case "invoice.paid":
			return fulfillInvoice(event);
		case "customer.subscription.updated":
		case "customer.subscription.deleted":
			return syncSubscription(event);
		default:
			return;
	}
}

async function fulfillCheckout(event: Stripe.Event): Promise<void> {
	const session = event.data.object as Stripe.Checkout.Session;
	return fulfillPaidCheckoutSession(session, event.type);
}

async function fulfillInvoice(event: Stripe.Event): Promise<void> {
	const invoice = event.data.object as Stripe.Invoice;
	if (invoice.billing_reason !== "subscription_cycle") return;

	const meta = invoice.parent?.subscription_details?.metadata;
	const userId = meta?.userId;
	const productId = meta?.productId;
	const grant = productId ? PRODUCT_GRANTS[productId] : undefined;

	if (!userId || !grant || grant.plan || !grant.pokes) return;

	await prisma.$transaction([
		prisma.processedStripeEvent.create({
			data: { id: invoice.id, type: event.type },
		}),
		prisma.user.updateMany({
			where: { id: userId },
			data: {
				pokes: { increment: grant.pokes },
				pokeSubCreditedAt: new Date(),
				pokeCycleHigh: grant.pokes,
			},
		}),
	]);
}

async function syncSubscription(event: Stripe.Event): Promise<void> {
	const subscription = event.data.object as Stripe.Subscription;
	const productId = subscription.metadata?.productId;
	const grant = productId ? PRODUCT_GRANTS[productId] : undefined;
	if (!grant?.plan) return;

	const stripeCustomerId = customerId(subscription.customer);
	if (!stripeCustomerId) return;

	const cancelled =
		event.type === "customer.subscription.deleted" ||
		subscription.status === "canceled" ||
		subscription.status === "incomplete_expired";

	await prisma.$transaction([
		prisma.processedStripeEvent.create({
			data: { id: event.id, type: event.type },
		}),
		prisma.user.updateMany({
			where: { stripeCustomerId },
			data: cancelled
				? { subscriptionPlan: null, subscriptionStatus: "canceled" }
				: { subscriptionStatus: subscription.status },
		}),
	]);
}
