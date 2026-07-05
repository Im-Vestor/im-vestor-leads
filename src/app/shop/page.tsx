import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Wallet } from "@/app/profile/wallet";
import { getActivePokeProductId, SHOP_PRODUCTS } from "@/lib/stripe";
import { getOrCreateUser } from "@/lib/user";
import { ShopClient } from "./shop-client";

export const metadata: Metadata = {
	title: "Shop",
	description: "Buy pokes, lead credits and memberships.",
};

export default async function ShopPage() {
	const user = await getOrCreateUser();
	if (!user) redirect("/sign-in");

	let activePokePlan: string | null = null;
	if (user.stripeCustomerId) {
		try {
			activePokePlan = await getActivePokeProductId(user.stripeCustomerId);
		} catch {
			activePokePlan = null;
		}
	}

	return (
		<main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10">
			<header className="space-y-2">
				<h1 className="font-bold text-3xl tracking-tight">Shop</h1>
				<p className="text-muted-foreground">
					Buy pokes, unlock leads, or upgrade your membership.
				</p>
			</header>

			<Wallet
				pokes={user.pokes}
				leadCredits={user.leadCredits}
				subscriptionPlan={user.subscriptionPlan}
				subscriptionStatus={user.subscriptionStatus}
				canManageBilling={Boolean(user.stripeCustomerId)}
				showBuyMore={false}
			/>

			<ShopClient
				products={SHOP_PRODUCTS}
				activePokePlan={activePokePlan}
				pokeCycleHigh={user.pokeCycleHigh}
			/>
		</main>
	);
}
