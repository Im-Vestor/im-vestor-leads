import "server-only";
import Stripe from "stripe";
import { env } from "@/env";

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
	const key = env.STRIPE_SECRET_KEY;
	if (!key) {
		throw new Error(
			"STRIPE_SECRET_KEY is not set. Fill it in .env before using the shop.",
		);
	}
	if (!stripe) {
		stripe = new Stripe(key);
	}
	return stripe;
}

export type ShopCategory = "subscription" | "pokes" | "leads";

export type ShopProduct = {
	id: string;
	name: string;
	description: string;
	priceLabel: string;
	priceId: string | undefined;
	mode: "payment" | "subscription";
	category: ShopCategory;
	pokes?: number;
	recurring?: {
		priceLabel: string;
		priceId: string | undefined;
	};
};

export const SHOP_PRODUCTS: ShopProduct[] = [
	{
		id: "subscription-monthly",
		name: "Monthly Membership",
		description: "Full marketplace access, billed monthly.",
		priceLabel: "€19.99 / month",
		priceId: env.STRIPE_PRICE_SUBSCRIPTION_MONTHLY,
		mode: "subscription",
		category: "subscription",
	},
	{
		id: "subscription-annual",
		name: "Annual Membership",
		description: "Full marketplace access, billed yearly (2 months free).",
		priceLabel: "€179.88 / year",
		priceId: env.STRIPE_PRICE_SUBSCRIPTION_ANNUAL,
		mode: "subscription",
		category: "subscription",
	},
	{
		id: "poke-pack-3",
		name: "3 Pokes",
		description: "Send 3 introduction pokes to other members.",
		priceLabel: "€39.99",
		priceId: env.STRIPE_PRICE_POKE_PACK_3,
		mode: "payment",
		category: "pokes",
		pokes: 3,
		recurring: {
			priceLabel: "€29.99 / month",
			priceId: env.STRIPE_PRICE_POKE_PACK_3_MONTHLY,
		},
	},
	{
		id: "poke-pack-5",
		name: "5 Pokes",
		description: "Send 5 introduction pokes to other members.",
		priceLabel: "€49.99",
		priceId: env.STRIPE_PRICE_POKE_PACK_5,
		mode: "payment",
		category: "pokes",
		pokes: 5,
		recurring: {
			priceLabel: "€39.99 / month",
			priceId: env.STRIPE_PRICE_POKE_PACK_5_MONTHLY,
		},
	},
	{
		id: "poke-pack-10",
		name: "10 Pokes",
		description: "Send 10 introduction pokes to other members.",
		priceLabel: "€69.99",
		priceId: env.STRIPE_PRICE_POKE_PACK_10,
		mode: "payment",
		category: "pokes",
		pokes: 10,
		recurring: {
			priceLabel: "€49.99 / month",
			priceId: env.STRIPE_PRICE_POKE_PACK_10_MONTHLY,
		},
	},
	{
		id: "lead-credit",
		name: "1 Lead Credit",
		description: "Unlock the full profile, media and chat for one lead.",
		priceLabel: "€24.99",
		priceId: env.STRIPE_PRICE_LEAD_CREDIT,
		mode: "payment",
		category: "leads",
	},
];

export function getShopProduct(id: string): ShopProduct | undefined {
	return SHOP_PRODUCTS.find((p) => p.id === id);
}

export type SubscriptionPlan = "monthly" | "annual";

export type ProductGrant = {
	pokes?: number;
	leadCredits?: number;
	plan?: SubscriptionPlan;
};

export const PRODUCT_GRANTS: Record<string, ProductGrant> = {
	"subscription-monthly": { plan: "monthly", pokes: 5 },
	"subscription-annual": { plan: "annual", pokes: 10 },
	"poke-pack-3": { pokes: 3 },
	"poke-pack-5": { pokes: 5 },
	"poke-pack-10": { pokes: 10 },
	"lead-credit": { leadCredits: 1 },
};

export function isPokeGrant(grant: ProductGrant | undefined): boolean {
	return Boolean(grant && !grant.plan && grant.pokes);
}

export async function findActivePokeSubscription(
	customerId: string,
): Promise<Stripe.Subscription | null> {
	const subs = await getStripe().subscriptions.list({
		customer: customerId,
		limit: 100,
	});
	return (
		subs.data.find((s) => {
			if (s.status === "canceled" || s.status === "incomplete_expired") {
				return false;
			}
			const pid = s.metadata?.productId;
			return isPokeGrant(pid ? PRODUCT_GRANTS[pid] : undefined);
		}) ?? null
	);
}

export async function getActivePokeProductId(
	customerId: string,
): Promise<string | null> {
	const sub = await findActivePokeSubscription(customerId);
	return sub?.metadata?.productId ?? null;
}
