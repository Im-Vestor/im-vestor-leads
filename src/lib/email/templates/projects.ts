import { CURRENCY_SYMBOLS } from "@/app/projects/schema";
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

type Currency = keyof typeof CURRENCY_SYMBOLS;

const amount = new Intl.NumberFormat("en-US");

function money(value: number, currency: Currency): string {
	return `${CURRENCY_SYMBOLS[currency] ?? "€"}${amount.format(value)}`;
}

export function projectPublishedEmail(input: {
	projectId: string;
	projectName: string;
	investmentGoal: number;
	currency: Currency;
	equity: number | null;
	hasMedia: boolean;
	hasVideoPitch: boolean;
}): EmailContent {
	const gaps: string[] = [];
	if (!input.hasVideoPitch) {
		gaps.push(
			"Record a <strong>video pitch</strong> — it is the first thing investors open.",
		);
	}
	if (!input.hasMedia) {
		gaps.push("Add <strong>photos or videos</strong> of the product or team.");
	}
	if (input.equity === null) {
		gaps.push(
			"State the <strong>equity offered</strong> so investors can size the deal.",
		);
	}

	return buildEmail({
		subject: `${input.projectName} is live on the marketplace`,
		preheader: "Investors can now find, unlock and message you about it.",
		eyebrow: "Project published",
		title: `${esc(input.projectName)} is live.`,
		blocks: [
			p(
				"Your project is now visible on the marketplace. Investors can find it, spend a lead credit to unlock the full profile, and start a conversation with you.",
			),
			panel([
				{ label: "Project", value: esc(input.projectName) },
				{
					label: "Investment goal",
					value: money(input.investmentGoal, input.currency),
					strong: true,
				},
				...(input.equity !== null
					? [{ label: "Equity offered", value: `${input.equity}%` }]
					: []),
				{ label: "Status", value: "Published" },
			]),
			...(gaps.length > 0
				? [p("<strong>Make it convert</strong>"), bullets(gaps)]
				: [
						p(
							"Your listing is complete. Keep an eye on your messages — unlocked leads usually write within days.",
						),
					]),
			note(
				"Want to be seen first? A Hyper Train ticket features your project on the dashboard carousel for 7 days.",
			),
		],
		cta: {
			label: "View your project",
			href: appUrl(`/projects/${input.projectId}`),
		},
		secondaryCta: { label: "Get a Hyper Train ticket", href: appUrl("/shop") },
		footerNote:
			"You are receiving this because you published a project on IM-VESTOR.",
	});
}

/** To the founder: an investor just spent a credit on their project. */
export function leadUnlockedForEntrepreneurEmail(input: {
	projectId: string;
	projectName: string;
	investorName: string;
	investorCountry: string | null;
	investorCapacity: string | null;
	investorSectors: string[];
}): EmailContent {
	return buildEmail({
		subject: `An investor unlocked ${input.projectName}`,
		preheader: `${input.investorName} paid to see the full profile of ${input.projectName}.`,
		eyebrow: "New lead",
		title: "An investor unlocked your project.",
		blocks: [
			p(
				`<strong>${esc(input.investorName)}</strong> spent a lead credit to open the full profile of <strong>${esc(input.projectName)}</strong> — media, numbers and direct chat included.`,
			),
			panel([
				{ label: "Investor", value: esc(input.investorName), strong: true },
				...(input.investorCountry
					? [{ label: "Based in", value: esc(input.investorCountry) }]
					: []),
				...(input.investorCapacity
					? [{ label: "Ticket size", value: esc(input.investorCapacity) }]
					: []),
				...(input.investorSectors.length > 0
					? [
							{
								label: "Interested in",
								value: esc(input.investorSectors.join(", ")),
							},
						]
					: []),
				{ label: "Project", value: esc(input.projectName) },
			]),
			p(
				"They paid to look at you. Open the conversation before the interest cools off.",
			),
		],
		cta: { label: "Message the investor", href: appUrl("/messages") },
		secondaryCta: {
			label: "Review your project page",
			href: appUrl(`/projects/${input.projectId}`),
		},
		footerNote:
			"You are receiving this because an investor unlocked one of your projects.",
	});
}

/** To the investor: receipt + what the credit bought them. */
export function leadUnlockedForInvestorEmail(input: {
	projectId: string;
	projectName: string;
	founderName: string;
	investmentGoal: number;
	currency: Currency;
	creditsLeft: number;
}): EmailContent {
	return buildEmail({
		subject: `You unlocked ${input.projectName}`,
		preheader: `Full profile, media and direct chat with ${input.founderName} are now open.`,
		eyebrow: "Lead unlocked",
		title: `${esc(input.projectName)} is open to you.`,
		blocks: [
			p(
				"One lead credit spent. The full profile, media library and a direct line to the founder are yours — permanently.",
			),
			panel([
				{ label: "Project", value: esc(input.projectName) },
				{ label: "Founder", value: esc(input.founderName) },
				{
					label: "Investment goal",
					value: money(input.investmentGoal, input.currency),
					strong: true,
				},
				{ label: "Access", value: "Permanent" },
			]),
			metric(
				String(input.creditsLeft),
				input.creditsLeft === 1
					? "lead credit left in your wallet"
					: "lead credits left in your wallet",
			),
			...(input.creditsLeft === 0
				? [
						note(
							"You are out of lead credits. Top up in the shop to unlock the next project.",
						),
					]
				: []),
		],
		cta: {
			label: "Open the project",
			href: appUrl(`/projects/${input.projectId}`),
		},
		secondaryCta:
			input.creditsLeft === 0
				? { label: "Buy more lead credits", href: appUrl("/shop") }
				: { label: "Message the founder", href: appUrl("/messages") },
		footerNote:
			"You are receiving this because you unlocked a lead on IM-VESTOR.",
	});
}

export function hypertrainActivatedEmail(input: {
	target: "project" | "profile";
	subjectName: string;
	projectId?: string;
	until: Date;
	ticketsLeft: number;
	days: number;
}): EmailContent {
	const isProject = input.target === "project";
	const endsOn = input.until.toLocaleDateString("en-US", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});

	return buildEmail({
		subject: `${input.subjectName} is on the Hyper Train`,
		preheader: `Featured on the dashboard carousel until ${endsOn}.`,
		eyebrow: "Hyper Train",
		title: isProject
			? `${esc(input.subjectName)} is now featured.`
			: "Your profile is now featured.",
		blocks: [
			p(
				isProject
					? "Your project is riding the Hyper Train carousel at the top of the dashboard — the first thing every investor sees when they log in."
					: "Your investor profile is riding the Hyper Train carousel at the top of the dashboard, in front of every founder browsing for capital.",
			),
			metric(`${input.days} days`, `of featured placement, until ${endsOn}`),
			panel([
				{ label: "Featured", value: esc(input.subjectName) },
				{ label: "Ends on", value: endsOn, strong: true },
				{ label: "Tickets left", value: String(input.ticketsLeft) },
			]),
			p(
				"Make the window count: keep your page current and reply fast to anyone who reaches out.",
			),
		],
		cta: {
			label: isProject ? "View your project" : "View the dashboard",
			href:
				isProject && input.projectId
					? appUrl(`/projects/${input.projectId}`)
					: appUrl("/dashboard"),
		},
		secondaryCta:
			input.ticketsLeft === 0
				? { label: "Buy another ticket", href: appUrl("/shop") }
				: undefined,
		footerNote:
			"You are receiving this because you activated a Hyper Train ticket.",
	});
}
