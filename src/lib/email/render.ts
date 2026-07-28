import { appUrl } from "./config";
import { brand, fontStack, radius } from "./theme";

/** A piece of email body rendered in both MIME parts at once. */
export type Block = { html: string; text: string };

export type EmailContent = { subject: string; html: string; text: string };

export type Cta = { label: string; href: string };

const ENTITIES: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#39;",
};

/** Escape anything that came from a user before it reaches the HTML part. */
export function esc(value: string | null | undefined): string {
	return (value ?? "").replace(/[&<>"']/g, (c) => ENTITIES[c] as string);
}

/** Derive the plain-text twin of a snippet of body HTML. */
function toText(html: string): string {
	return html
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<[^>]+>/g, "")
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/[ \t]+/g, " ")
		.trim();
}

const BODY_TEXT = `margin:0 0 16px;font-family:${fontStack};font-size:15px;line-height:24px;color:${brand.foreground};`;

export function p(html: string): Block {
	return { html: `<p style="${BODY_TEXT}">${html}</p>`, text: toText(html) };
}

export function note(html: string): Block {
	return {
		html: `<p style="margin:0 0 16px;font-family:${fontStack};font-size:13px;line-height:20px;color:${brand.muted};">${html}</p>`,
		text: toText(html),
	};
}

export function bullets(items: string[]): Block {
	const rows = items
		.map(
			(item) =>
				`<tr><td width="18" valign="top" style="padding:0 0 8px;font-family:${fontStack};font-size:15px;line-height:24px;color:${brand.gold};">&#8226;</td><td valign="top" style="padding:0 0 8px;font-family:${fontStack};font-size:15px;line-height:24px;color:${brand.foreground};">${item}</td></tr>`,
		)
		.join("");
	return {
		html: `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 16px;"><tbody>${rows}</tbody></table>`,
		text: items.map((item) => `• ${toText(item)}`).join("\n"),
	};
}

/** Key/value summary panel — order details, project facts, balances. */
export function panel(
	rows: { label: string; value: string; strong?: boolean }[],
): Block {
	const cells = rows
		.map(({ label, value, strong }, index) => {
			const border =
				index === 0 ? "" : `border-top:1px solid ${brand.borderSoft};`;
			return `<tr>
					<td style="${border}padding:10px 0;font-family:${fontStack};font-size:13px;line-height:20px;color:${brand.muted};">${label}</td>
					<td align="right" style="${border}padding:10px 0;font-family:${fontStack};font-size:14px;line-height:20px;font-weight:${strong ? 700 : 500};color:${strong ? brand.gold : brand.foreground};">${value}</td>
				</tr>`;
		})
		.join("");
	return {
		html: `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;background-color:${brand.surfaceSoft};border:1px solid ${brand.border};border-radius:${radius.panel};">
			<tbody><tr><td style="padding:6px 18px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tbody>${cells}</tbody></table></td></tr></tbody></table>`,
		text: rows.map((r) => `${toText(r.label)}: ${toText(r.value)}`).join("\n"),
	};
}

/** A single headline figure — "3 pokes", "7 days", "€24.99". */
export function metric(value: string, label: string): Block {
	return {
		html: `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;background-color:${brand.surfaceSoft};border:1px solid ${brand.border};border-radius:${radius.panel};">
			<tbody><tr><td align="center" style="padding:22px 18px;">
				<div style="font-family:${fontStack};font-size:30px;line-height:36px;font-weight:700;color:${brand.gold};">${value}</div>
				<div style="margin-top:4px;font-family:${fontStack};font-size:13px;line-height:20px;color:${brand.muted};">${label}</div>
			</td></tr></tbody></table>`,
		text: `${toText(value)} — ${toText(label)}`,
	};
}

/** Quoted message preview, used by the conversation emails. */
export function quote(body: string, author?: string): Block {
	const byline = author
		? `<div style="margin:0 0 6px;font-family:${fontStack};font-size:12px;line-height:18px;text-transform:uppercase;letter-spacing:0.08em;color:${brand.gold};">${author}</div>`
		: "";
	return {
		html: `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;">
			<tbody><tr>
				<td width="3" style="background-color:${brand.goldDeep};border-radius:2px;">&nbsp;</td>
				<td style="padding:2px 0 2px 16px;">
					${byline}
					<div style="font-family:${fontStack};font-size:15px;line-height:24px;color:${brand.foreground};">${body}</div>
				</td>
			</tr></tbody></table>`,
		text: author
			? `${toText(author)}:\n"${toText(body)}"`
			: `"${toText(body)}"`,
	};
}

export function divider(): Block {
	return {
		html: `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;"><tbody><tr><td style="border-top:1px solid ${brand.border};font-size:0;line-height:0;">&nbsp;</td></tr></tbody></table>`,
		text: "—",
	};
}

function button({ label, href }: Cta): string {
	return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 8px;"><tbody><tr>
		<td bgcolor="${brand.gold}" style="border-radius:${radius.button};background-color:${brand.gold};background-image:linear-gradient(90deg,${brand.gold},${brand.goldDeep});">
			<a href="${href}" style="display:inline-block;padding:13px 28px;font-family:${fontStack};font-size:15px;font-weight:700;line-height:20px;color:${brand.onGold};text-decoration:none;border-radius:${radius.button};">${label}</a>
		</td>
	</tr></tbody></table>`;
}

export type EmailInput = {
	subject: string;
	/** Inbox preview line. Keep it short and specific. */
	preheader: string;
	/** Small gold label above the title. */
	eyebrow?: string;
	title: string;
	blocks: Block[];
	cta?: Cta;
	secondaryCta?: Cta;
	/** Explains why this email landed — replaces the generic footer line. */
	footerNote?: string;
};

export function buildEmail(input: EmailInput): EmailContent {
	const { subject, preheader, eyebrow, title, blocks, cta, secondaryCta } =
		input;

	const eyebrowHtml = eyebrow
		? `<div style="margin:0 0 10px;font-family:${fontStack};font-size:12px;line-height:18px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:${brand.goldDeep};">${eyebrow}</div>`
		: "";

	const secondaryHtml = secondaryCta
		? `<p style="margin:12px 0 0;font-family:${fontStack};font-size:14px;line-height:22px;color:${brand.muted};"><a href="${secondaryCta.href}" style="color:${brand.gold};text-decoration:underline;">${secondaryCta.label}</a></p>`
		: "";

	const footerNote =
		input.footerNote ??
		"You are receiving this because you have an IM-VESTOR account.";

	const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="x-ua-compatible" content="ie=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${esc(subject)}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
body{margin:0;padding:0;width:100%!important;background-color:${brand.background};}
a{color:${brand.gold};}
@media only screen and (max-width:600px){
	.sm-px{padding-left:20px!important;padding-right:20px!important;}
	.sm-py{padding-top:28px!important;padding-bottom:28px!important;}
	.sm-title{font-size:22px!important;line-height:30px!important;}
}
</style>
</head>
<body style="margin:0;padding:0;background-color:${brand.background};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${brand.background};">${esc(preheader)}</div>
<div style="display:none;max-height:0;overflow:hidden;">&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${brand.background};">
<tbody><tr><td align="center" style="padding:32px 16px 48px;">

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px;">
<tbody>

<tr><td align="center" style="padding:0 0 24px;">
	<a href="${appUrl("/")}" style="text-decoration:none;">
		<img src="${appUrl("/logo/imvestor.png")}" width="28" height="25" alt="" style="display:inline-block;vertical-align:middle;border:0;">
		<span style="display:inline-block;vertical-align:middle;padding-left:8px;font-family:${fontStack};font-size:15px;font-weight:600;letter-spacing:0.04em;color:${brand.foreground};">Im-Vestor <span style="color:${brand.gold};">Leads</span></span>
	</a>
</td></tr>

<tr><td style="background-color:${brand.surface};border:1px solid ${brand.border};border-radius:${radius.card};overflow:hidden;">
	<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tbody>
		<tr><td height="3" bgcolor="${brand.gold}" style="height:3px;font-size:0;line-height:0;background-color:${brand.gold};background-image:linear-gradient(90deg,${brand.gold},${brand.goldDeep});">&nbsp;</td></tr>
		<tr><td class="sm-px sm-py" style="padding:36px 40px;">
			${eyebrowHtml}
			<h1 class="sm-title" style="margin:0 0 18px;font-family:${fontStack};font-size:26px;line-height:34px;font-weight:700;color:${brand.foreground};">${title}</h1>
			${blocks.map((b) => b.html).join("\n")}
			${cta ? button(cta) : ""}
			${secondaryHtml}
		</td></tr>
	</tbody></table>
</td></tr>

<tr><td align="center" style="padding:24px 16px 0;">
	<p style="margin:0 0 8px;font-family:${fontStack};font-size:12px;line-height:20px;color:${brand.muted};">${esc(footerNote)}</p>
	<p style="margin:0;font-family:${fontStack};font-size:12px;line-height:20px;color:${brand.muted};">
		<a href="${appUrl("/dashboard")}" style="color:${brand.muted};text-decoration:underline;">Dashboard</a>
		&nbsp;&middot;&nbsp;
		<a href="${appUrl("/profile")}" style="color:${brand.muted};text-decoration:underline;">Profile</a>
		&nbsp;&middot;&nbsp;
		<a href="${appUrl("/messages")}" style="color:${brand.muted};text-decoration:underline;">Messages</a>
	</p>
	<p style="margin:12px 0 0;font-family:${fontStack};font-size:12px;line-height:20px;color:${brand.muted};">&copy; IM-VESTOR — the marketplace for entrepreneurs and investors.</p>
</td></tr>

</tbody></table>

</td></tr></tbody></table>
</body>
</html>`;

	const textParts = [
		"IM-VESTOR LEADS",
		"",
		...(eyebrow ? [toText(eyebrow).toUpperCase()] : []),
		toText(title),
		"",
		blocks
			.map((b) => b.text)
			.filter(Boolean)
			.join("\n\n"),
		...(cta ? ["", `${toText(cta.label)}: ${cta.href}`] : []),
		...(secondaryCta
			? [`${toText(secondaryCta.label)}: ${secondaryCta.href}`]
			: []),
		"",
		"—",
		footerNote,
		appUrl("/dashboard"),
	];

	return { subject, html, text: textParts.join("\n").trim() };
}
