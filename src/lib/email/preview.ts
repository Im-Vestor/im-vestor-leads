import type { EmailContent } from "./render";
import { referralJoinedEmail, welcomeEmail } from "./templates/account";
import {
	paymentFailedEmail,
	purchaseReceiptEmail,
	subscriptionCancelledEmail,
	subscriptionRenewedEmail,
	subscriptionStartedEmail,
} from "./templates/billing";
import {
	newMessageEmail,
	supportReplyEmail,
	supportRequestEmail,
} from "./templates/messages";
import {
	pokeAcceptedEmail,
	pokeReceivedEmail,
	pokeRejectedEmail,
} from "./templates/pokes";
import {
	hypertrainActivatedEmail,
	leadUnlockedForEntrepreneurEmail,
	leadUnlockedForInvestorEmail,
	projectPublishedEmail,
} from "./templates/projects";

const BOOST_END = new Date("2026-08-04T12:00:00Z");

/** Sample payloads behind `/api/dev/emails`. Dev tooling only. */
export const EMAIL_PREVIEWS: Record<string, () => EmailContent> = {
	welcome: () =>
		welcomeEmail({
			name: "Ana Ferreira",
			role: "INVESTOR",
			referralCode: "ANAF-7K2P",
			pokes: 2,
			leadCredits: 1,
		}),
	"welcome-entrepreneur": () =>
		welcomeEmail({
			name: "Miguel Santos",
			role: "ENTREPRENEUR",
			referralCode: "MIGU-3XQ9",
			pokes: 2,
			leadCredits: 1,
		}),
	"referral-joined": () =>
		referralJoinedEmail({
			referrerName: "Ana Ferreira",
			newMemberName: "Miguel Santos",
			newMemberRole: "ENTREPRENEUR",
			referralCode: "ANAF-7K2P",
		}),
	"project-published": () =>
		projectPublishedEmail({
			projectId: "prj_demo",
			projectName: "Solaris Grid",
			investmentGoal: 750_000,
			currency: "EUR",
			equity: 12,
			hasMedia: true,
			hasVideoPitch: false,
		}),
	"lead-unlocked-founder": () =>
		leadUnlockedForEntrepreneurEmail({
			projectId: "prj_demo",
			projectName: "Solaris Grid",
			investorName: "Ana Ferreira",
			investorCountry: "Portugal",
			investorCapacity: "€200K–€500K",
			investorSectors: ["Clean Tech", "Technology"],
		}),
	"lead-unlocked-investor": () =>
		leadUnlockedForInvestorEmail({
			projectId: "prj_demo",
			projectName: "Solaris Grid",
			founderName: "Miguel Santos",
			investmentGoal: 750_000,
			currency: "EUR",
			creditsLeft: 2,
		}),
	"hypertrain-activated": () =>
		hypertrainActivatedEmail({
			target: "project",
			subjectName: "Solaris Grid",
			projectId: "prj_demo",
			until: BOOST_END,
			ticketsLeft: 1,
			days: 7,
		}),
	"poke-received": () =>
		pokeReceivedEmail({
			senderName: "Ana Ferreira",
			senderRole: "INVESTOR",
			senderCountry: "Portugal",
			message:
				"I back clean energy at seed and Solaris Grid is exactly the shape I look for. Worth a call?",
		}),
	"poke-accepted": () =>
		pokeAcceptedEmail({
			receiverName: "Miguel Santos",
			conversationId: "conv_demo",
		}),
	"poke-rejected": () =>
		pokeRejectedEmail({
			receiverName: "Miguel Santos",
			pokeBalance: 3,
		}),
	"new-message": () =>
		newMessageEmail({
			senderName: "Ana Ferreira",
			senderRole: "INVESTOR",
			preview:
				"Saw your numbers on Solaris Grid — can we talk through the equity split this week?",
			unreadCount: 3,
		}),
	"support-reply": () =>
		supportReplyEmail({
			memberName: "Miguel Santos",
			preview:
				"We refunded the duplicate lead credit — it should show in your wallet already.",
		}),
	"support-request": () =>
		supportRequestEmail({
			memberName: "Miguel Santos",
			memberEmail: "miguel@example.com",
			memberRole: "Entrepreneur",
			preview: "I was charged twice for the same lead credit.",
		}),
	"purchase-receipt": () =>
		purchaseReceiptEmail({
			productName: "10 Pokes",
			priceLabel: "€69.99",
			quantity: 1,
			granted: [{ label: "Pokes added", value: "+10" }],
			balances: [
				{ label: "Pokes", value: "12" },
				{ label: "Lead credits", value: "2" },
				{ label: "Hyper Train tickets", value: "0" },
			],
		}),
	"subscription-started": () =>
		subscriptionStartedEmail({
			planName: "Annual Membership",
			priceLabel: "€179.88 / year",
			pokesGranted: 10,
			features: [
				"Full marketplace access",
				"Priority support",
				"Analytics dashboard",
				"2 months free",
			],
		}),
	"subscription-renewed": () =>
		subscriptionRenewedEmail({
			planName: "5 Pokes",
			pokesGranted: 5,
			pokeBalance: 7,
		}),
	"subscription-cancelled": () =>
		subscriptionCancelledEmail({
			planName: "Monthly Membership",
			pokes: 4,
			leadCredits: 2,
		}),
	"payment-failed": () =>
		paymentFailedEmail({
			planName: "Monthly Membership",
			amountLabel: "€19.99",
			attemptsLeft: true,
		}),
};

export const EMAIL_PREVIEW_NAMES = Object.keys(EMAIL_PREVIEWS);
