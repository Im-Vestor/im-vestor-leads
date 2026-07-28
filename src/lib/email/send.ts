import "server-only";
import { after } from "next/server";
import { emailFrom, emailReplyTo, getResend } from "./config";
import type { EmailContent } from "./render";

export type SendEmailInput = EmailContent & {
	to: string;
	/** Groups sends in the Resend dashboard, e.g. "lead-unlocked". */
	tag: string;
	replyTo?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Sends one transactional email. Never throws and never rejects: a mail
 * provider outage must not fail a checkout, a message send or a webhook.
 * Returns false when the email was skipped or the provider errored.
 */
export async function sendEmail(input: SendEmailInput): Promise<boolean> {
	const to = input.to?.trim();
	if (!to || !EMAIL_RE.test(to)) return false;

	const resend = getResend();
	if (!resend) {
		console.info(
			`[email] RESEND_API_KEY unset — skipped "${input.subject}" to ${to} (${input.tag})`,
		);
		return false;
	}

	try {
		const { error } = await resend.emails.send({
			from: emailFrom(),
			to,
			subject: input.subject,
			html: input.html,
			text: input.text,
			replyTo: input.replyTo ?? emailReplyTo(),
			tags: [{ name: "type", value: input.tag }],
		});
		if (error) {
			console.error(`[email] ${input.tag} → ${to} failed:`, error);
			return false;
		}
		return true;
	} catch (err) {
		console.error(`[email] ${input.tag} → ${to} threw:`, err);
		return false;
	}
}

/**
 * Queues email work to run after the response is flushed, so a slow provider
 * never shows up as latency in a server action or webhook.
 */
export function deliver(task: () => Promise<unknown>): void {
	const guarded = async () => {
		try {
			await task();
		} catch (err) {
			console.error("[email] delivery task failed:", err);
		}
	};

	try {
		after(guarded);
	} catch {
		// Outside a request scope (scripts, tests) — fall back to running inline.
		void guarded();
	}
}
