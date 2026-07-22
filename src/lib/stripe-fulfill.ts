import "server-only";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe, PRODUCT_GRANTS } from "@/lib/stripe";

const POKE_SUB_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

export function stripeCustomerId(
	customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
): string | undefined {
	if (!customer) return undefined;
	return typeof customer === "string" ? customer : customer.id;
}

export async function fulfillPaidCheckoutSession(
	session: Stripe.Checkout.Session,
	eventType = "checkout.session.completed",
): Promise<void> {
	const userId = session.metadata?.userId;
	const productId = session.metadata?.productId;
	const grant = productId ? PRODUCT_GRANTS[productId] : undefined;

	if (!userId || !grant) {
		console.warn("[stripe] checkout without known user/product", {
			userId,
			productId,
		});
		return;
	}

	const customer = stripeCustomerId(session.customer);
	const isPokeSubscription = session.mode === "subscription" && !grant.plan;

	if (isPokeSubscription) {
		const existing = await prisma.user.findUnique({
			where: { id: userId },
			select: { pokeSubCreditedAt: true },
		});
		const last = existing?.pokeSubCreditedAt?.getTime() ?? 0;
		const onCooldown = Date.now() - last < POKE_SUB_COOLDOWN_MS;

		await prisma.$transaction([
			prisma.processedStripeEvent.create({
				data: { id: session.id, type: eventType },
			}),
			prisma.user.updateMany({
				where: { id: userId },
				data: {
					...(onCooldown
						? {}
						: {
								pokes: { increment: grant.pokes ?? 0 },
								pokeSubCreditedAt: new Date(),
							}),
					pokeCycleHigh: grant.pokes ?? 0,
					...(customer ? { stripeCustomerId: customer } : {}),
				},
			}),
		]);
		return;
	}

	let quantity = 1;
	if (grant.hypertrainTickets) {
		try {
			const items = await getStripe().checkout.sessions.listLineItems(
				session.id,
				{ limit: 1 },
			);
			quantity = items.data[0]?.quantity ?? 1;
		} catch {
			quantity = 1;
		}
	}

	await prisma.$transaction([
		prisma.processedStripeEvent.create({
			data: { id: session.id, type: eventType },
		}),
		prisma.user.updateMany({
			where: { id: userId },
			data: {
				pokes: { increment: grant.pokes ?? 0 },
				leadCredits: { increment: grant.leadCredits ?? 0 },
				hypertrainTickets: {
					increment: (grant.hypertrainTickets ?? 0) * quantity,
				},
				...(grant.plan
					? { subscriptionPlan: grant.plan, subscriptionStatus: "active" }
					: {}),
				...(customer ? { stripeCustomerId: customer } : {}),
			},
		}),
	]);
}
