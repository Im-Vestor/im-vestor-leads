import "server-only";
import { Resend } from "resend";
import { env } from "@/env";

const DEFAULT_FROM = "IM-VESTOR <onboarding@resend.dev>";

let resend: Resend | null = null;

/** Null when RESEND_API_KEY is unset — callers log the email instead of sending. */
export function getResend(): Resend | null {
	if (!env.RESEND_API_KEY) return null;
	if (!resend) resend = new Resend(env.RESEND_API_KEY);
	return resend;
}

export function emailFrom(): string {
	return env.EMAIL_FROM || DEFAULT_FROM;
}

export function emailReplyTo(): string | undefined {
	return env.EMAIL_REPLY_TO || undefined;
}

/** Absolute origin for links and images. Emails cannot use relative URLs. */
export function appUrl(path = "/"): string {
	const base = (env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
		/\/+$/,
		"",
	);
	return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}
