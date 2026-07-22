"use client";

import { CheckIcon, StarIcon } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";
import type { ShopCategory, ShopProduct } from "@/lib/stripe";
import {
	changePokePlan,
	confirmCheckout,
	createCheckoutSession,
} from "./actions";

async function confirmAndToast(
	sessionId: string,
	t: ReturnType<typeof useTranslation>,
) {
	for (let attempt = 0; attempt < 4; attempt++) {
		const res = await confirmCheckout(sessionId);
		if (res.status === "fulfilled") {
			toast.success(t("shopToastPaymentConfirmed"));
			return;
		}
		if (res.status === "unpaid") {
			toast.error(t("shopToastPaymentFailed"));
			return;
		}
		if (res.status === "error") {
			toast.error(t("shopToastConfirmError"));
			return;
		}
		await new Promise((r) => setTimeout(r, 1500));
	}
	toast.info(t("shopToastPaymentReceived"));
}

export function ShopClient({
	products,
	activePokePlan,
	pokeCycleHigh,
}: {
	products: ShopProduct[];
	activePokePlan: string | null;
	pokeCycleHigh: number;
}) {
	const t = useTranslation();
	const [loadingId, setLoadingId] = useState<string | null>(null);
	const [pokesRecurring, setPokesRecurring] = useState(activePokePlan !== null);
	const [switchTarget, setSwitchTarget] = useState<ShopProduct | null>(null);
	const router = useRouter();

	const sections: {
		category: ShopCategory;
		number: string;
		eyebrow: string;
		headline: string;
		description: string;
	}[] = [
		{
			category: "subscription",
			number: "01",
			eyebrow: t("shopSectionMembershipsEyebrow"),
			headline: t("shopSectionMembershipsHeadline"),
			description: t("shopSectionMembershipsDescription"),
		},
		{
			category: "pokes",
			number: "02",
			eyebrow: t("shopSectionPokesEyebrow"),
			headline: t("shopSectionPokesHeadline"),
			description: t("shopSectionPokesDescription"),
		},
		{
			category: "leads",
			number: "03",
			eyebrow: t("shopSectionLeadsEyebrow"),
			headline: t("shopSectionLeadsHeadline"),
			description: t("shopSectionLeadsDescription"),
		},
		{
			category: "hypertrain",
			number: "04",
			eyebrow: t("shopSectionHypertrainEyebrow"),
			headline: t("shopSectionHypertrainHeadline"),
			description: t("shopSectionHypertrainDescription"),
		},
	];

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
			toast.info(t("shopToastCheckoutCancelled"));
		} else if (status === "success" && sessionId) {
			void confirmAndToast(sessionId, t);
		}
	}, [t]);

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
			toast.error(t("shopToastGenericError"));
		} finally {
			setLoadingId(null);
		}
	}

	async function switchPlan(productId: string) {
		setLoadingId(productId);
		try {
			const result = await changePokePlan(productId);
			if (result.ok) {
				toast.success(t("shopToastPlanUpdated"));
				router.refresh();
				return;
			}
			toast.error(result.error);
		} catch {
			toast.error(t("shopToastGenericError"));
		} finally {
			setLoadingId(null);
		}
	}

	return (
		<>
			<div className="space-y-14">
				{sections.map((section, index) => {
					const items = products.filter((p) => p.category === section.category);
					if (items.length === 0) return null;
					const hasRecurring = items.some((p) => p.recurring);
					const recurring = hasRecurring && pokesRecurring;
					const cardCols =
						items.length >= 3
							? "sm:grid-cols-2 xl:grid-cols-3"
							: "sm:grid-cols-2";
					return (
						<section
							key={section.category}
							className={`grid gap-8 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-12 ${
								index > 0 ? "border-t pt-14" : ""
							}`}
						>
							<div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
								<p className="font-medium text-muted-foreground text-sm tracking-widest">
									{section.number} — {section.eyebrow.toUpperCase()}
								</p>
								<h2 className="font-bold text-3xl tracking-tight md:text-4xl">
									{section.headline}
								</h2>
								<p className="text-muted-foreground">{section.description}</p>
								{hasRecurring && (
									<div className="inline-flex rounded-md border p-0.5 text-sm">
										<button
											type="button"
											onClick={() => setPokesRecurring(false)}
											className={`rounded px-3 py-1 ${pokesRecurring ? "text-muted-foreground" : "bg-secondary"}`}
										>
											{t("shopBillingOneTime")}
										</button>
										<button
											type="button"
											onClick={() => setPokesRecurring(true)}
											className={`rounded px-3 py-1 ${pokesRecurring ? "bg-secondary" : "text-muted-foreground"}`}
										>
											{t("shopBillingMonthly")}
										</button>
									</div>
								)}
							</div>
							<div className={`grid gap-4 ${cardCols}`}>
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
							{isUpgrade
								? t("shopDialogUpgradeTo")
								: t("shopDialogDowngradeTo")}{" "}
							{switchTarget?.name}?
						</AlertDialogTitle>
						<AlertDialogDescription>
							{isRevert
								? t("shopDialogRevertDesc")
								: isUpgrade
									? t("shopDialogUpgradeDesc")
									: t("shopDialogDowngradeDesc")}
						</AlertDialogDescription>
					</AlertDialogHeader>

					<ul className="space-y-1.5 text-muted-foreground text-sm">
						{isRevert ? (
							<li>{t("shopDialogRevertBalance")}</li>
						) : isUpgrade ? (
							<li>
								{t("shopDialogBalanceLabel")}{" "}
								<strong className="text-foreground">
									+{creditDelta} {t("shopPokesUnit")}
								</strong>{" "}
								{t("shopDialogAddedRightAway")}
							</li>
						) : (
							<li>{t("shopDialogDowngradeBalance")}</li>
						)}
						<li>{t("shopDialogPaymentMethod")}</li>
					</ul>

					<AlertDialogFooter>
						<AlertDialogCancel>{t("commonCancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (switchTarget) void switchPlan(switchTarget.id);
								setSwitchTarget(null);
							}}
						>
							{isRevert
								? t("shopConfirmSwitch")
								: isUpgrade
									? t("shopUpgrade")
									: t("shopConfirmDowngrade")}
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
	const t = useTranslation();
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
		? t("shopLabelComingSoon")
		: isLoading
			? t("shopLabelProcessing")
			: isCurrentPlan
				? t("shopLabelCurrentPlan")
				: canSwitch
					? t("shopLabelSwitchPlan")
					: isSubscription
						? t("shopLabelSubscribe")
						: t("shopLabelBuyNow");

	return (
		<SpotlightCard
			spotlightColor="rgba(229, 205, 130, 0.15)"
			className="flex rounded-xl"
		>
			<Card
				className={`flex w-full flex-col ${isCurrentPlan ? "border-[#E5CD82]/40" : ""}`}
			>
				<CardHeader>
					<div className="flex items-start justify-between gap-2">
						<CardTitle>{product.name}</CardTitle>
						{product.badge ? (
							<Badge variant="secondary" className="shrink-0">
								<StarIcon className="size-3" />
								{product.badge}
							</Badge>
						) : null}
					</div>
					<CardDescription>{product.description}</CardDescription>
				</CardHeader>
				<CardContent className="flex-grow space-y-4">
					<div>
						<p className="font-bold text-2xl tracking-tight">{priceLabel}</p>
						{product.priceNote ? (
							<p className="text-muted-foreground text-sm">
								{product.priceNote}
							</p>
						) : null}
					</div>
					{product.features?.length ? (
						<ul className="space-y-2 text-sm">
							{product.features.map((feature) => (
								<li key={feature} className="flex items-start gap-2">
									<CheckIcon className="mt-0.5 size-4 shrink-0 text-[#E5CD82]" />
									<span>{feature}</span>
								</li>
							))}
						</ul>
					) : null}
				</CardContent>
				<CardFooter>
					<Button
						className="w-full"
						size="lg"
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
