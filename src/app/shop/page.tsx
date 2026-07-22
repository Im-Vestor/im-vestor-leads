import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WalletBar } from "@/app/profile/wallet";
import { prisma } from "@/lib/prisma";
import { getActivePokeProductId, SHOP_PRODUCTS } from "@/lib/stripe";
import { getOrCreateUser } from "@/lib/user";
import { getT } from "@/utils/translations/server";
import { ShopClient } from "./shop-client";
import { UseHypertrainTicket } from "./use-hypertrain";

export const metadata: Metadata = {
	title: "Shop",
	description: "Buy pokes, lead credits and memberships.",
};

export default async function ShopPage() {
	const t = await getT();
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

	const now = new Date();
	const boostableProjects =
		user.role === "INVESTOR"
			? []
			: (
					await prisma.project.findMany({
						where: { entrepreneurId: user.id, status: "PUBLISHED" },
						select: { id: true, name: true, hypertrainUntil: true },
						orderBy: { createdAt: "desc" },
					})
				).map((p) => ({
					id: p.id,
					name: p.name,
					active: p.hypertrainUntil !== null && p.hypertrainUntil > now,
				}));

	return (
		<main className="mx-auto w-full max-w-content space-y-8 px-4 py-8 md:py-10">
			<header className="space-y-2">
				<h1 className="font-bold text-3xl tracking-tight">
					{t("shopHeading")}
				</h1>
				<p className="text-muted-foreground">{t("shopHeaderSubtitle")}</p>
			</header>

			<WalletBar
				pokes={user.pokes}
				leadCredits={user.leadCredits}
				hypertrainTickets={user.hypertrainTickets}
				subscriptionPlan={user.subscriptionPlan}
				canManageBilling={Boolean(user.stripeCustomerId)}
				useTicketSlot={
					<UseHypertrainTicket
						role={user.role}
						tickets={user.hypertrainTickets}
						profileActive={
							user.hypertrainUntil !== null && user.hypertrainUntil > now
						}
						projects={boostableProjects}
					/>
				}
			/>

			<ShopClient
				products={SHOP_PRODUCTS}
				activePokePlan={activePokePlan}
				pokeCycleHigh={user.pokeCycleHigh}
			/>
		</main>
	);
}
