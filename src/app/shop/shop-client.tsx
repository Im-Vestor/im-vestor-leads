"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import SpotlightCard from "@/components/SpotlightCard";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { ShopCategory, ShopProduct } from "@/lib/stripe";
import {
	changePokePlan,
	confirmCheckout,
	createCheckoutSession,
} from "./actions";

async function confirmAndToast(sessionId: string) {
	for (let attempt = 0; attempt < 4; attempt++) {
		const res = await confirmCheckout(sessionId);
		if (res.status === "fulfilled") {
			toast.success("Payment confirmed — your balance is updated.");
			return;
		}
		if (res.status === "unpaid") {
			toast.error("Payment didn't go through. You weren't charged.");
			return;
		}
		if (res.status === "error") {
			toast.error(
				"Couldn't confirm your purchase — contact support if charged.",
			);
			return;
		}
		await new Promise((r) => setTimeout(r, 1500));
	}
	toast.info("Payment received — updating your balance, refresh in a moment.");
}

const SECTIONS: { category: ShopCategory; title: string }[] = [
	{ category: "subscription", title: "Memberships" },
	{ category: "pokes", title: "Pokes" },
	{ category: "leads", title: "Lead Credits" },
];

export function ShopClient({
	products,
	activePokePlan,
	pokeCycleHigh,
}: {
	products: ShopProduct[];
	activePokePlan: string | null;
	pokeCycleHigh: number;
}) {
	const [loadingId, setLoadingId] = useState<string | null>(null);
	const [pokesRecurring, setPokesRecurring] = useState(activePokePlan !== null);
	const [switchTarget, setSwitchTarget] = useState<ShopProduct | null>(null);
	const router = useRouter();

	const currentPokes =
		products.find((p) => p.id === activePokePlan)?.pokes ?? 0;
	const targetPokes = switchTarget?.pokes ?? 0;
	const isUpgrade = targetPokes > currentPokes;
	const creditDelta = Math.max(
		0,
		targetPokes - Math.max(currentPokes, pokeCycleHigh),
	);
	const isRevert = isUpgrade && creditDelta === 0;

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const status = params.get("checkout");
		const sessionId = params.get("session_id");
		if (!status) return;
		window.history.replaceState(null, "", "/shop");
		if (status === "cancelled") {
			toast.info("Checkout cancelled.");
		} else if (status === "success" && sessionId) {
			void confirmAndToast(sessionId);
		}
	}, []);

	async function buy(product: ShopProduct, recurring: boolean) {
		setLoadingId(product.id);
		try {
			const result = await createCheckoutSession(product.id, recurring);
			if (result.ok) {
				window.location.href = result.url;
				return;
			}
			toast.error(result.error);
		} catch {
			toast.error("Something went wrong. Try again.");
		} finally {
			setLoadingId(null);
		}
	}

	async function switchPlan(productId: string) {
		setLoadingId(productId);
		try {
			const result = await changePokePlan(productId);
			if (result.ok) {
				toast.success("Plan updated.");
				router.refresh();
				return;
			}
			toast.error(result.error);
		} catch {
			toast.error("Something went wrong. Try again.");
		} finally {
			setLoadingId(null);
		}
	}

	return (
		<>
			<div className="space-y-10">
				{SECTIONS.map((section) => {
					const items = products.filter((p) => p.category === section.category);
					if (items.length === 0) return null;
					const hasRecurring = items.some((p) => p.recurring);
					const recurring = hasRecurring && pokesRecurring;
					return (
						<section key={section.category} className="space-y-4">
							<div className="flex flex-wrap items-center justify-between gap-3">
								<h2 className="font-semibold text-muted-foreground text-sm uppercase tracking-wider">
									{section.title}
								</h2>
								{hasRecurring && (
									<div className="inline-flex rounded-md border p-0.5 text-sm">
										<button
											type="button"
											onClick={() => setPokesRecurring(false)}
											className={`rounded px-3 py-1 ${pokesRecurring ? "text-muted-foreground" : "bg-secondary"}`}
										>
											One-time
										</button>
										<button
											type="button"
											onClick={() => setPokesRecurring(true)}
											className={`rounded px-3 py-1 ${pokesRecurring ? "bg-secondary" : "text-muted-foreground"}`}
										>
											Monthly
										</button>
									</div>
								)}
							</div>
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{items.map((product) => (
									<ProductCard
										key={product.id}
										product={product}
										recurring={recurring}
										isLoading={loadingId === product.id}
										activePokePlan={activePokePlan}
										onBuy={buy}
										onSwitch={setSwitchTarget}
									/>
								))}
							</div>
						</section>
					);
				})}
			</div>

			<AlertDialog
				open={switchTarget !== null}
				onOpenChange={(open) => {
					if (!open) setSwitchTarget(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{isUpgrade ? "Upgrade" : "Downgrade"} to {switchTarget?.name}?
						</AlertDialogTitle>
						<AlertDialogDescription>
							{isRevert
								? "You already received this plan's pokes this billing cycle, so there's no charge and no new pokes now."
								: isUpgrade
									? "You'll be charged only the prorated difference now, using the payment method from your current plan."
									: "This takes effect on your next billing cycle — no charge now, and you keep your current plan until then."}
						</AlertDialogDescription>
					</AlertDialogHeader>

					<ul className="space-y-1.5 text-muted-foreground text-sm">
						{isRevert ? (
							<li>
								Balance: full pokes resume at your next renewal — nothing added
								now.
							</li>
						) : isUpgrade ? (
							<li>
								Balance:{" "}
								<strong className="text-foreground">
									+{creditDelta} pokes
								</strong>{" "}
								added right away.
							</li>
						) : (
							<li>Your pokes: we won't remove any you've already received.</li>
						)}
						<li>Payment method: change it anytime via Manage billing.</li>
					</ul>

					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (switchTarget) void switchPlan(switchTarget.id);
								setSwitchTarget(null);
							}}
						>
							{isRevert
								? "Confirm switch"
								: isUpgrade
									? "Upgrade"
									: "Confirm downgrade"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

function ProductCard({
	product,
	recurring,
	isLoading,
	activePokePlan,
	onBuy,
	onSwitch,
}: {
	product: ShopProduct;
	recurring: boolean;
	isLoading: boolean;
	activePokePlan: string | null;
	onBuy: (product: ShopProduct, recurring: boolean) => void;
	onSwitch: (product: ShopProduct) => void;
}) {
	const activePriceId = recurring
		? product.recurring?.priceId
		: product.priceId;
	const priceLabel =
		recurring && product.recurring
			? product.recurring.priceLabel
			: product.priceLabel;
	const unavailable = !activePriceId;
	const isSubscription = recurring || product.mode === "subscription";

	const isPokeMonthly = recurring && product.category === "pokes";
	const isCurrentPlan = isPokeMonthly && activePokePlan === product.id;
	const canSwitch =
		isPokeMonthly && !!activePokePlan && activePokePlan !== product.id;

	const label = unavailable
		? "Coming soon"
		: isLoading
			? "Processing…"
			: isCurrentPlan
				? "Current plan"
				: canSwitch
					? "Switch to this plan"
					: isSubscription
						? "Subscribe"
						: "Buy now";

	return (
		<SpotlightCard
			spotlightColor="rgba(229, 205, 130, 0.15)"
			className="flex rounded-xl"
		>
			<Card
				className={`flex w-full flex-col ${isCurrentPlan ? "border-[#E5CD82]/40" : ""}`}
			>
				<CardHeader>
					<CardTitle>{product.name}</CardTitle>
					<CardDescription>{product.description}</CardDescription>
				</CardHeader>
				<CardContent className="flex-grow">
					<p className="font-bold text-2xl tracking-tight">{priceLabel}</p>
				</CardContent>
				<CardFooter>
					<Button
						className="w-full"
						variant={canSwitch ? "outline" : "default"}
						disabled={unavailable || isLoading || isCurrentPlan}
						onClick={() =>
							canSwitch ? onSwitch(product) : onBuy(product, recurring)
						}
					>
						{label}
					</Button>
				</CardFooter>
			</Card>
		</SpotlightCard>
	);
}
