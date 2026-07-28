import { appUrl } from "../config";
import {
	buildEmail,
	type EmailContent,
	esc,
	note,
	p,
	panel,
	quote,
} from "../render";

/** Sent to a member who was offline when a message landed. */
export function newMessageEmail(input: {
	senderName: string;
	senderRole: "ENTREPRENEUR" | "INVESTOR" | "ADMIN";
	preview: string;
	unreadCount: number;
}): EmailContent {
	const roleLabel =
		input.senderRole === "INVESTOR"
			? "Investor"
			: input.senderRole === "ADMIN"
				? "IM-VESTOR"
				: "Entrepreneur";
	const more = input.unreadCount > 1;

	return buildEmail({
		subject: `${input.senderName} sent you a message`,
		preheader: input.preview,
		eyebrow: "New message",
		title: `${esc(input.senderName)} wrote to you.`,
		blocks: [
			quote(esc(input.preview), `${esc(input.senderName)} · ${roleLabel}`),
			...(more
				? [
						p(
							`You have <strong>${input.unreadCount} unread messages</strong> waiting in your inbox.`,
						),
					]
				: [p("Reply from your inbox to keep the conversation going.")]),
			note(
				"We only email you about messages you miss while you are away from the app.",
			),
		],
		cta: { label: "Read and reply", href: appUrl("/messages") },
		footerNote:
			"You are receiving this because someone messaged you on IM-VESTOR.",
	});
}

/** Sent to a member when the support team answers their thread. */
export function supportReplyEmail(input: {
	memberName: string | null;
	preview: string;
}): EmailContent {
	const firstName = input.memberName?.trim().split(/\s+/)[0];

	return buildEmail({
		subject: "IM-VESTOR Support replied to you",
		preheader: input.preview,
		eyebrow: "Support",
		title: firstName
			? `${esc(firstName)}, we replied.`
			: "We replied to your message.",
		blocks: [
			p("Our support team answered your thread:"),
			quote(esc(input.preview), "IM-VESTOR Support"),
			p(
				"Reply in the app if anything is still unclear — the whole thread stays in your Messages tab.",
			),
		],
		cta: { label: "Open the conversation", href: appUrl("/messages") },
		footerNote:
			"You are receiving this because you contacted IM-VESTOR support.",
	});
}

/** Sent to the support inbox when a member opens or continues a thread. */
export function supportRequestEmail(input: {
	memberName: string;
	memberEmail: string;
	memberRole: string;
	preview: string;
}): EmailContent {
	return buildEmail({
		subject: `Support request from ${input.memberName}`,
		preheader: input.preview,
		eyebrow: "Support inbox",
		title: "A member needs help.",
		blocks: [
			quote(esc(input.preview), esc(input.memberName)),
			panel([
				{ label: "Member", value: esc(input.memberName), strong: true },
				{ label: "Email", value: esc(input.memberEmail) },
				{ label: "Role", value: esc(input.memberRole) },
			]),
		],
		cta: { label: "Open the support inbox", href: appUrl("/admin/support") },
		footerNote: "Internal notification from the IM-VESTOR support queue.",
	});
}
