import Link from "next/link";
import CountUp from "@/components/CountUp";
import ShinyText from "@/components/ShinyText";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { getT } from "@/utils/translations/server";
import { openBillingPortal } from "./actions";

type WalletProps = {
	pokes: number;
	leadCredits: number;
	hypertrainTickets?: number;
	subscriptionPlan: string | null;
	subscriptionStatus: string | null;
	canManageBilling: boolean;
	showBuyMore?: boolean;
	compact?: boolean;
};

export async function Wallet({
	pokes,
	leadCredits,
	hypertrainTickets,
	subscriptionPlan,
	subscriptionStatus,
	canManageBilling,
	showBuyMore = true,
	compact = false,
}: WalletProps) {
	const t = await getT();
	const planLabel = subscriptionPlan
		? subscriptionPlan === "monthly"
			? t("profPlanMonthly")
			: subscriptionPlan === "annual"
				? t("profPlanAnnual")
				: subscriptionPlan
		: null;
	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("profWalletTitle")}</CardTitle>
				{!compact && (
					<CardDescription>{t("profWalletDescription")}</CardDescription>
				)}
			</CardHeader>
			<CardContent className="space-y-6">
				<div
					className={
						compact
							? "grid grid-cols-1 gap-3"
							: hypertrainTickets !== undefined
								? "grid grid-cols-2 gap-4 xl:grid-cols-4"
								: "grid grid-cols-2 gap-4 sm:grid-cols-3"
					}
				>
					<Stat label={t("profPokes")} value={pokes} />
					<Stat label={t("profLeadCredits")} value={leadCredits} />
					{hypertrainTickets !== undefined && (
						<Stat
							label={t("profHypertrainTickets")}
							value={hypertrainTickets}
						/>
					)}
					<div className="flex flex-col rounded-lg border p-4">
						<p className="text-muted-foreground text-xs uppercase tracking-wider">
							{t("profMembership")}
						</p>
						{subscriptionPlan ? (
							<div className="mt-auto space-y-1.5 pt-1">
								<p className="font-semibold text-sm">
									<ShinyText
										text={planLabel ?? subscriptionPlan}
										color="#EDD689"
										shineColor="#ffffff"
										speed={4}
									/>
								</p>
								<SubscriptionBadge status={subscriptionStatus} />
							</div>
						) : (
							<p className="mt-auto pt-1 font-semibold text-muted-foreground text-sm">
								{t("profMembershipNone")}
							</p>
						)}
					</div>
				</div>

				{(showBuyMore || canManageBilling) && (
					<div
						className={
							compact
								? "flex flex-col gap-2"
								: "flex flex-col gap-2 sm:flex-row sm:flex-wrap"
						}
					>
						{showBuyMore && (
							<Button
								render={<Link href="/shop" />}
								size={compact ? "default" : "lg"}
								className={compact ? "w-full" : "w-full sm:w-auto"}
							>
								{t("profBuyMore")}
							</Button>
						)}
						{canManageBilling && (
							<form
								action={openBillingPortal}
								className={compact ? "w-full" : "w-full sm:w-auto"}
							>
								<Button
									type="submit"
									variant="outline"
									size={compact ? "default" : "lg"}
									className={compact ? "w-full" : "w-full sm:w-auto"}
								>
									{t("profManageBilling")}
								</Button>
							</form>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

export async function WalletBar({
	pokes,
	leadCredits,
	hypertrainTickets,
	subscriptionPlan,
	canManageBilling,
	useTicketSlot,
}: {
	pokes: number;
	leadCredits: number;
	hypertrainTickets?: number;
	subscriptionPlan: string | null;
	canManageBilling: boolean;
	useTicketSlot?: React.ReactNode;
}) {
	const t = await getT();
	const membershipValue = subscriptionPlan
		? subscriptionPlan === "monthly"
			? t("profPlanMonthly")
			: subscriptionPlan === "annual"
				? t("profPlanAnnual")
				: subscriptionPlan
		: t("profMembershipNone");
	return (
		<div className="flex flex-wrap items-center gap-2 border-b pb-6">
			<WalletPill label={t("profPokes")} value={String(pokes)} />
			<WalletPill label={t("profLeadCredits")} value={String(leadCredits)} />
			{hypertrainTickets !== undefined && (
				<WalletPill
					label={t("profHypertrainTickets")}
					value={String(hypertrainTickets)}
				/>
			)}
			<WalletPill label={t("profMembership")} value={membershipValue} />
			{useTicketSlot}
			{canManageBilling && (
				<form action={openBillingPortal} className="ml-auto">
					<Button type="submit" variant="outline" size="sm">
						{t("profManageBilling")}
					</Button>
				</form>
			)}
		</div>
	);
}

function WalletPill({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center gap-2 rounded-full border bg-card px-4 py-2">
			<span className="text-muted-foreground text-sm">{label}</span>
			<span className="font-semibold text-sm">{value}</span>
		</div>
	);
}

function Stat({ label, value }: { label: string; value: number }) {
	return (
		<div className="flex flex-col rounded-lg border p-4">
			<p className="text-muted-foreground text-xs uppercase tracking-wider">
				{label}
			</p>
			<p className="mt-auto pt-1 font-bold text-2xl tabular-nums">
				<CountUp to={value} duration={1} />
			</p>
		</div>
	);
}

function SubscriptionBadge({ status }: { status: string | null }) {
	if (!status) return null;
	const variant =
		status === "active"
			? "default"
			: status === "past_due"
				? "destructive"
				: "outline";
	return <Badge variant={variant}>{status.replace(/_/g, " ")}</Badge>;
}
