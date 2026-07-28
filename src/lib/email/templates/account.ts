import { appUrl } from "../config";
import {
	buildEmail,
	bullets,
	type EmailContent,
	esc,
	note,
	p,
	panel,
} from "../render";

export type Role = "ENTREPRENEUR" | "INVESTOR" | "ADMIN";

const FIRST_STEPS: Record<Role, string[]> = {
	ENTREPRENEUR: [
		"<strong>Publish your project</strong> — the marketplace only shows published projects.",
		"<strong>Add media and a video pitch</strong> — investors unlock the ones that look real.",
		"<strong>Watch your inbox</strong> — every unlocked lead can start a conversation.",
	],
	INVESTOR: [
		"<strong>Set your sectors and ticket size</strong> — it is how founders find you.",
		"<strong>Browse the dashboard</strong> — filter projects by sector, stage and value.",
		"<strong>Spend a lead credit</strong> — unlock the full profile, media and chat.",
	],
	ADMIN: [
		"<strong>Open the admin area</strong> — support inbox and conversations live there.",
		"<strong>Watch the support queue</strong> — members write in from their Messages tab.",
	],
};

export function welcomeEmail(input: {
	name: string | null;
	role: Role;
	referralCode: string;
	pokes: number;
	leadCredits: number;
}): EmailContent {
	const firstName = input.name?.trim().split(/\s+/)[0];
	const isInvestor = input.role === "INVESTOR";

	return buildEmail({
		subject: "Welcome to IM-VESTOR",
		preheader: `Your account is ready${input.leadCredits > 0 ? ` — ${input.leadCredits} lead credit and ${input.pokes} pokes are already in your wallet.` : "."}`,
		eyebrow: "Welcome aboard",
		title: firstName ? `Welcome, ${esc(firstName)}.` : "Welcome to IM-VESTOR.",
		blocks: [
			p(
				isInvestor
					? "You are in. IM-VESTOR is where founders publish real projects and investors like you find the next one worth a conversation."
					: "You are in. IM-VESTOR is where you put your project in front of investors who are actively looking for one.",
			),
			panel([
				{
					label: "Account type",
					value: isInvestor ? "Investor" : "Entrepreneur",
				},
				{ label: "Pokes", value: String(input.pokes) },
				{ label: "Lead credits", value: String(input.leadCredits) },
				{
					label: "Your referral code",
					value: esc(input.referralCode),
					strong: true,
				},
			]),
			p("<strong>Start here</strong>"),
			bullets(FIRST_STEPS[input.role]),
			note(
				`Share your referral code and get credited whenever someone signs up with it.`,
			),
		],
		cta: { label: "Go to your dashboard", href: appUrl("/dashboard") },
		secondaryCta: { label: "Complete your profile", href: appUrl("/profile") },
		footerNote:
			"You are receiving this because you just created an IM-VESTOR account.",
	});
}

export function referralJoinedEmail(input: {
	referrerName: string | null;
	newMemberName: string | null;
	newMemberRole: Role;
	referralCode: string;
}): EmailContent {
	const who = input.newMemberName?.trim() || "Someone";
	const roleLabel =
		input.newMemberRole === "INVESTOR" ? "an investor" : "an entrepreneur";

	return buildEmail({
		subject: `${who} joined IM-VESTOR with your code`,
		preheader: `Your referral code ${input.referralCode} was used to sign up.`,
		eyebrow: "Referral",
		title: "Someone joined using your code.",
		blocks: [
			p(
				`<strong>${esc(who)}</strong> signed up as ${roleLabel} using your referral code.`,
			),
			panel([
				{ label: "New member", value: esc(who) },
				{
					label: "Joined as",
					value:
						input.newMemberRole === "INVESTOR" ? "Investor" : "Entrepreneur",
				},
				{ label: "Your code", value: esc(input.referralCode), strong: true },
			]),
			p(
				"Keep sharing it — every founder and investor you bring in makes the marketplace worth more to you.",
			),
		],
		cta: { label: "Open the marketplace", href: appUrl("/dashboard") },
		footerNote:
			"You are receiving this because someone used your IM-VESTOR referral code.",
	});
}
