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
import { openBillingPortal } from "./actions";

const PLAN_LABELS: Record<string, string> = {
	monthly: "Monthly membership",
	annual: "Annual membership",
};

type WalletProps = {
	pokes: number;
	leadCredits: number;
	subscriptionPlan: string | null;
	subscriptionStatus: string | null;
	canManageBilling: boolean;
	showBuyMore?: boolean;
};

export function Wallet({
	pokes,
	leadCredits,
	subscriptionPlan,
	subscriptionStatus,
	canManageBilling,
	showBuyMore = true,
}: WalletProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Your wallet</CardTitle>
				<CardDescription>
					Pokes, lead credits and your membership.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
					<Stat label="Pokes" value={pokes} />
					<Stat label="Lead credits" value={leadCredits} />
					<div className="rounded-lg border p-4">
						<p className="text-muted-foreground text-xs uppercase tracking-wider">
							Membership
						</p>
						{subscriptionPlan ? (
							<div className="mt-1 space-y-1.5">
								<p className="font-semibold text-sm">
									<ShinyText
										text={PLAN_LABELS[subscriptionPlan] ?? subscriptionPlan}
										color="#EDD689"
										shineColor="#ffffff"
										speed={4}
									/>
								</p>
								<SubscriptionBadge status={subscriptionStatus} />
							</div>
						) : (
							<p className="mt-1 font-semibold text-muted-foreground text-sm">
								None
							</p>
						)}
					</div>
				</div>

				{(showBuyMore || canManageBilling) && (
					<div className="flex flex-wrap gap-2">
						{showBuyMore && (
							<Button render={<Link href="/shop" />}>Buy more</Button>
						)}
						{canManageBilling && (
							<form action={openBillingPortal}>
								<Button type="submit" variant="outline">
									Manage billing
								</Button>
							</form>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function Stat({ label, value }: { label: string; value: number }) {
	return (
		<div className="rounded-lg border p-4">
			<p className="text-muted-foreground text-xs uppercase tracking-wider">
				{label}
			</p>
			<p className="mt-1 font-bold text-2xl tabular-nums">
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
