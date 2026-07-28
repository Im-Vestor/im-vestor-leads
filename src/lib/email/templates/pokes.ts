import type { UserRole } from "@/generated/prisma/enums";
import { appUrl } from "../config";
import {
	buildEmail,
	type EmailContent,
	esc,
	metric,
	note,
	p,
	panel,
	quote,
} from "../render";

const ROLE_WORD: Record<UserRole, string> = {
	ENTREPRENEUR: "Entrepreneur",
	INVESTOR: "Investor",
	ADMIN: "Im-Vestor",
};

/**
 * To the receiver: someone spent a poke on them and is waiting on an answer.
 * The whole email exists to get a yes or a no, so it says what each one means.
 */
export function pokeReceivedEmail(input: {
	senderName: string;
	senderRole: UserRole;
	senderCountry: string | null;
	message: string;
}): EmailContent {
	return buildEmail({
		subject: `${input.senderName} wants to connect`,
		preheader:
			"Accept to open the conversation, or decline — it costs you nothing.",
		eyebrow: "New poke",
		title: `${esc(input.senderName)} is asking to reach you.`,
		blocks: [
			p(
				`<strong>${esc(input.senderName)}</strong> spent a poke to introduce themselves. Nothing is open yet — <strong>you</strong> decide whether this turns into a conversation.`,
			),
			...(input.message
				? [quote(esc(input.message), esc(input.senderName))]
				: []),
			panel([
				{ label: "From", value: esc(input.senderName), strong: true },
				{ label: "Role", value: ROLE_WORD[input.senderRole] },
				...(input.senderCountry
					? [{ label: "Based in", value: esc(input.senderCountry) }]
					: []),
				{ label: "Status", value: "Waiting for your answer" },
			]),
			p(
				"<strong>Accept</strong> and a direct conversation opens between the two of you. <strong>Decline</strong> and nothing happens — they cannot message you, and their poke goes back to them.",
			),
			note("Answer it from the notification bell, at the top of any page."),
		],
		cta: { label: "Answer this poke", href: appUrl("/dashboard") },
		footerNote:
			"You are receiving this because a member poked you on IM-VESTOR.",
	});
}

/** To the sender: the door opened. */
export function pokeAcceptedEmail(input: {
	receiverName: string;
	conversationId: string | null;
}): EmailContent {
	return buildEmail({
		subject: `${input.receiverName} accepted your poke`,
		preheader:
			"The conversation is open — say something before the interest cools.",
		eyebrow: "Poke accepted",
		title: `${esc(input.receiverName)} said yes.`,
		blocks: [
			p(
				`Your poke landed. <strong>${esc(input.receiverName)}</strong> accepted the introduction, and a direct conversation is now open between you.`,
			),
			p(
				"The first message is the one that matters. Be specific about why you reached out — what you saw, and what you want from a first call.",
			),
		],
		cta: {
			label: "Open the conversation",
			href: appUrl(
				input.conversationId
					? `/messages?c=${input.conversationId}`
					: "/messages",
			),
		},
		footerNote: "You are receiving this because someone answered your poke.",
	});
}

/** To the sender: declined, and the poke is already back in their wallet. */
export function pokeRejectedEmail(input: {
	receiverName: string;
	pokeBalance: number;
}): EmailContent {
	return buildEmail({
		subject: `${input.receiverName} declined your poke`,
		preheader: "Your poke is back in your wallet — nothing was spent.",
		eyebrow: "Poke declined",
		title: "That one did not land.",
		blocks: [
			p(
				`<strong>${esc(input.receiverName)}</strong> chose not to open a conversation. It happens — timing, focus, or simply a different thesis.`,
			),
			metric(
				String(input.pokeBalance),
				input.pokeBalance === 1
					? "poke in your wallet — the declined one was returned"
					: "pokes in your wallet — the declined one was returned",
			),
			p(
				"Nothing was charged for this. Spend it on someone whose sector and stage line up more closely with what you are looking for.",
			),
		],
		cta: { label: "Find someone else", href: appUrl("/dashboard") },
		footerNote: "You are receiving this because someone answered your poke.",
	});
}
