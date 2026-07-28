import { appUrl } from "../config";
import {
	buildEmail,
	bullets,
	type EmailContent,
	esc,
	metric,
	note,
	p,
	panel,
} from "../render";

export type PurchasedItem = { label: string; value: string };

/** One-off purchases: poke packs, lead credits, Hyper Train tickets. */
export function purchaseReceiptEmail(input: {
	productName: string;
	priceLabel: string;
	quantity: number;
	granted: PurchasedItem[];
	balances: PurchasedItem[];
}): EmailContent {
	const qty = input.quantity > 1 ? ` × ${input.quantity}` : "";

	return buildEmail({
		subject: `Your IM-VESTOR purchase: ${input.productName}`,
		preheader: `${input.productName}${qty} is in your wallet.`,
		eyebrow: "Order confirmed",
		title: "Your purchase is in your wallet.",
		blocks: [
			p(
				"Payment went through and the balance has already been added to your account — nothing else to do.",
			),
			panel([
				{ label: "Item", value: `${esc(input.productName)}${qty}` },
				{ label: "Paid", value: esc(input.priceLabel), strong: true },
				...input.granted.map((g) => ({
					label: g.label,
					value: esc(g.value),
				})),
			]),
			p("<strong>Your balance now</strong>"),
			panel(
				input.balances.map((b) => ({
					label: b.label,
					value: esc(b.value),
				})),
			),
			note(
				"Invoices and payment methods live in the billing portal, linked from your profile.",
			),
		],
		cta: { label: "Go to the marketplace", href: appUrl("/dashboard") },
		secondaryCta: { label: "View your wallet", href: appUrl("/profile") },
		footerNote:
			"You are receiving this because you made a purchase on IM-VESTOR.",
	});
}

export function subscriptionStartedEmail(input: {
	planName: string;
	priceLabel: string;
	pokesGranted: number;
	features: string[];
}): EmailContent {
	return buildEmail({
		subject: `Your ${input.planName} is active`,
		preheader: "Full marketplace access is switched on.",
		eyebrow: "Membership active",
		title: "Your membership is live.",
		blocks: [
			p(
				"Full marketplace access is switched on. Here is what your plan includes:",
			),
			panel([
				{ label: "Plan", value: esc(input.planName), strong: true },
				{ label: "Price", value: esc(input.priceLabel) },
				...(input.pokesGranted > 0
					? [{ label: "Pokes added", value: String(input.pokesGranted) }]
					: []),
				{ label: "Status", value: "Active" },
			]),
			...(input.features.length > 0
				? [bullets(input.features.map((f) => esc(f)))]
				: []),
			note(
				"Cancel or change your plan any time from the billing portal in your profile.",
			),
		],
		cta: { label: "Start browsing leads", href: appUrl("/dashboard") },
		secondaryCta: { label: "Manage billing", href: appUrl("/profile") },
		footerNote:
			"You are receiving this because you started an IM-VESTOR membership.",
	});
}

/** Monthly poke subscription cycled and topped the balance back up. */
export function subscriptionRenewedEmail(input: {
	planName: string;
	pokesGranted: number;
	pokeBalance: number;
}): EmailContent {
	return buildEmail({
		subject: "Your pokes have been topped up",
		preheader: `${input.pokesGranted} pokes were added for the new billing cycle.`,
		eyebrow: "Renewal",
		title: "New cycle, new pokes.",
		blocks: [
			p(
				`Your <strong>${esc(input.planName)}</strong> renewed and the pokes for this cycle are already in your wallet.`,
			),
			metric(`+${input.pokesGranted}`, "pokes added this cycle"),
			panel([
				{ label: "Plan", value: esc(input.planName) },
				{
					label: "Poke balance",
					value: String(input.pokeBalance),
					strong: true,
				},
			]),
			note(
				"Change or cancel the plan any time from the billing portal in your profile.",
			),
		],
		cta: { label: "Use your pokes", href: appUrl("/dashboard") },
		secondaryCta: { label: "Manage billing", href: appUrl("/profile") },
		footerNote:
			"You are receiving this because you have a recurring IM-VESTOR plan.",
	});
}

export function subscriptionCancelledEmail(input: {
	planName: string;
	pokes: number;
	leadCredits: number;
}): EmailContent {
	return buildEmail({
		subject: "Your IM-VESTOR membership has ended",
		preheader:
			"Your balances stay with you — access can be switched back on any time.",
		eyebrow: "Membership ended",
		title: "Your membership has ended.",
		blocks: [
			p(
				`Your <strong>${esc(input.planName)}</strong> is now cancelled and you will not be billed again.`,
			),
			p(
				"Everything you already paid for stays yours — unlocked leads never expire, and your balances are untouched:",
			),
			panel([
				{ label: "Pokes", value: String(input.pokes) },
				{ label: "Lead credits", value: String(input.leadCredits) },
				{ label: "Unlocked leads", value: "Kept forever" },
			]),
			p("Changed your mind? Reactivating takes one click in the shop."),
		],
		cta: { label: "Reactivate membership", href: appUrl("/shop") },
		footerNote:
			"You are receiving this because your IM-VESTOR membership was cancelled.",
	});
}

export function paymentFailedEmail(input: {
	planName: string;
	amountLabel: string;
	attemptsLeft: boolean;
}): EmailContent {
	return buildEmail({
		subject: "Your IM-VESTOR payment did not go through",
		preheader: "Update your card to keep your plan running.",
		eyebrow: "Payment failed",
		title: "We could not charge your card.",
		blocks: [
			p(
				`The payment for your <strong>${esc(input.planName)}</strong> was declined.`,
			),
			panel([
				{ label: "Plan", value: esc(input.planName) },
				{ label: "Amount due", value: esc(input.amountLabel), strong: true },
			]),
			p(
				input.attemptsLeft
					? "We will retry automatically over the next few days. Updating your payment method now avoids any interruption."
					: "No further retries are scheduled. Update your payment method to keep your plan active.",
			),
			note("Already fixed it? Then you can ignore this email."),
		],
		cta: { label: "Update payment method", href: appUrl("/profile") },
		footerNote:
			"You are receiving this because a payment on your IM-VESTOR account failed.",
	});
}
